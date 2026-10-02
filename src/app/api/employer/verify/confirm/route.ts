import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { companyOtpVerifySchema } from "@/lib/validations"
import { verifyOtpHash, maskEmail, OTP_MAX_ATTEMPTS } from "@/lib/company-otp"
import { COIN_RULES } from "@/lib/employer-earnings"
import { slugify } from "@/lib/utils"
import { writeAuditLog } from "@/lib/moderation"

/**
 * Step 2 of inbox-proof verification: code belongs to this user+company+email,
 * single-use, expiring, attempt-capped. Only then is membership verified.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Login required" }, { status: 401 })
    const body = await request.json()
    const v = companyOtpVerifySchema.safeParse(body)
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 })

    const challenge = await prisma.companyOtpChallenge.findUnique({ where: { id: v.data.challengeId } })
    // Generic message on purpose - never reveal which part was wrong (anti-enumeration).
    if (!challenge || challenge.userId !== session.user.id || challenge.verified) {
      return NextResponse.json({ success: false, error: "Invalid or expired code" }, { status: 400 })
    }
    if (challenge.expiresAt.getTime() < Date.now()) {
      await prisma.companyOtpChallenge.delete({ where: { id: challenge.id } }).catch(() => {})
      return NextResponse.json({ success: false, error: "Code expired. Request a new one." }, { status: 400 })
    }
    if (challenge.attempts >= (challenge.maxAttempts || OTP_MAX_ATTEMPTS)) {
      await prisma.companyOtpChallenge.delete({ where: { id: challenge.id } }).catch(() => {})
      return NextResponse.json({ success: false, error: "Too many wrong tries. Request a new code." }, { status: 429 })
    }

    const ok = await verifyOtpHash(v.data.otp, challenge.otpHash)
    if (!ok) {
      const attempts = challenge.attempts + 1
      const locked = attempts >= (challenge.maxAttempts || OTP_MAX_ATTEMPTS)
      if (locked) {
        await prisma.companyOtpChallenge.delete({ where: { id: challenge.id } }).catch(() => {})
      } else {
        await prisma.companyOtpChallenge.update({ where: { id: challenge.id }, data: { attempts } }).catch(() => {})
      }
      await writeAuditLog({
        action: locked ? "OTP_LOCKED" : "OTP_FAIL",
        entity: "Company",
        entityId: challenge.companyId || `pending:${challenge.pendingName}`,
        userId: session.user.id,
        details: `Wrong code for ${maskEmail(challenge.workEmail)} (attempt ${attempts})`,
      }).catch(() => {})
      return NextResponse.json(
        { success: false, error: locked ? "Too many wrong tries. Request a new code." : "Invalid or expired code" },
        { status: locked ? 429 : 400 }
      )
    }

    // Success - bind verified membership. Company row is created here for manual flow,
    // so nobody gets a verified company without proving the inbox.
    let companyId = challenge.companyId
    if (!companyId) {
      const name = (challenge.pendingName || "").trim()
      if (!name) return NextResponse.json({ success: false, error: "Invalid or expired code" }, { status: 400 })
      const taken = await prisma.company.findUnique({ where: { name } }).catch(() => null)
      if (taken) {
        companyId = taken.id
      } else {
        const baseSlug = slugify(name) || `company-${Date.now().toString(36)}`
        const slugTaken = await prisma.company.findUnique({ where: { slug: baseSlug } }).catch(() => null)
        const created = await prisma.company.create({
          data: {
            name,
            slug: slugTaken ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug,
            website: challenge.pendingWebsite,
            description: challenge.pendingDescription,
            verifiedStatus: "VERIFIED",
            claimEmailDomain: challenge.workEmail.split("@")[1] || null,
          },
        })
        companyId = created.id
      }
    }

    await prisma.$transaction([
      prisma.company.update({
        where: { id: companyId as string },
        data: { verifiedStatus: "VERIFIED", claimEmailDomain: challenge.workEmail.split("@")[1] || undefined },
      }),
      prisma.companyMember.upsert({
        where: { companyId_userId: { companyId: companyId as string, userId: session.user.id } },
        update: { verified: true, role: "OWNER" },
        create: { companyId: companyId as string, userId: session.user.id, role: "OWNER", verified: true },
      }),
      prisma.companyOtpChallenge.delete({ where: { id: challenge.id } }),
    ])

    // Invalidate any other pending challenges for this user+email (single-use hygiene).
    await prisma.companyOtpChallenge.deleteMany({ where: { userId: session.user.id, workEmail: challenge.workEmail } }).catch(() => {})

    await writeAuditLog({
      action: "OTP_VERIFY",
      entity: "Company",
      entityId: companyId as string,
      userId: session.user.id,
      details: `Inbox verified for ${maskEmail(challenge.workEmail)}`,
    }).catch(() => {})

    const company = await prisma.company.findUnique({ where: { id: companyId as string } })

    // Pilot enrollment + referral linkage. No instant coins - coins are earned
    // only at milestones (7-day live, 3 apps, interview, hire). Referrer is
    // paid 1,000 coins when this company reaches the 3-application milestone.
    let enrolled = false
    let pilotFull = false
    let referralLinked = false
    try {
      const count = await prisma.rewardEnrollment.count()
      const existing = await prisma.rewardEnrollment.findUnique({ where: { companyId: companyId as string } }).catch(() => null)
      if (existing) {
        enrolled = true
      } else if (count < COIN_RULES.PILOT_MAX_COMPANIES) {
        await prisma.rewardEnrollment.create({ data: { companyId: companyId as string, userId: session.user.id } })
        enrolled = true
      } else {
        pilotFull = true
      }
      const refCode = request.cookies.get("emp_ref")?.value?.toUpperCase().trim() || null
      if (enrolled && refCode) {
        const codeRow = await prisma.employerReferralCode.findUnique({ where: { code: refCode } }).catch(() => null)
        const existingRef = await prisma.employerReferral.findUnique({ where: { referredUserId: session.user.id } }).catch(() => null)
        if (codeRow && codeRow.userId !== session.user.id && !existingRef) {
          await prisma.employerReferral.create({
            data: {
              codeId: codeRow.id,
              referrerUserId: codeRow.userId,
              referredUserId: session.user.id,
              companyId: companyId as string,
              status: "PENDING",
              signupBonusPaise: COIN_RULES.REFERRAL_COINS,
            },
          })
          referralLinked = true
        }
      }
    } catch { /* rewards must never block verification */ }

    return NextResponse.json({
      success: true,
      data: { companyId, company, enrolled, pilotFull, referralLinked },
      message: !enrolled
        ? `Verified ${company?.name || "company"} - pilot is full (100 companies), posting unlocked without coin rewards`
        : `Verified ${company?.name || "company"} - enrolled in coin rewards pilot`,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
