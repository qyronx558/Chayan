import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { companyOtpSendSchema } from "@/lib/validations"
import {
  generateOtp, hashOtp, maskEmail, logEmail, workEmailMatchesCompany,
  OTP_EXPIRY_MINUTES, OTP_RESEND_COOLDOWN_SECONDS,
  OTP_MAX_SENDS_PER_USER_15MIN, OTP_MAX_SENDS_PER_EMAIL_HOUR,
} from "@/lib/company-otp"
import { normalizeWebsite } from "@/lib/companies"
import { sendCompanyVerificationOtp } from "@/lib/email"
import { writeAuditLog } from "@/lib/moderation"

/**
 * Step 1 of inbox-proof verification: validate ownership intent + send OTP.
 * Never auto-verifies on string match - inbox proof is mandatory.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Login required" }, { status: 401 })
    const body = await request.json()
    const v = companyOtpSendSchema.safeParse(body)
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 })

    const workEmail = v.data.workEmail.toLowerCase().trim()
    let companyId: string | null = null
    let companyName = ""
    let companyWebsite: string | null = null
    let pendingName: string | null = null
    let pendingWebsite: string | null = null
    let pendingDescription: string | null = null

    if (v.data.companyId) {
      const company = await prisma.company.findUnique({ where: { id: v.data.companyId } })
      if (!company) return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 })
      companyId = company.id
      companyName = company.name
      companyWebsite = company.website
      // Already verified by this user? No need for another OTP.
      const already = await prisma.companyMember.findUnique({
        where: { companyId_userId: { companyId: company.id, userId: session.user.id } },
      }).catch(() => null)
      if (already?.verified && company.verifiedStatus === "VERIFIED") {
        return NextResponse.json({ success: true, alreadyVerified: true, message: "This company is already verified for you" })
      }
    } else {
      pendingName = v.data.name!.trim()
      pendingWebsite = normalizeWebsite(v.data.domain!.trim())
      pendingDescription = v.data.description?.trim() || null
      companyName = pendingName
      companyWebsite = pendingWebsite
      const taken = await prisma.company.findUnique({ where: { name: pendingName } }).catch(() => null)
      if (taken) {
        return NextResponse.json({ success: false, error: "This company already exists - please claim it instead", data: { companyId: taken.id } }, { status: 409 })
      }
    }

    // Domain ownership rule: free inboxes rejected, mismatch rejected.
    const match = workEmailMatchesCompany(workEmail, companyWebsite)
    if (!match.ok) return NextResponse.json({ success: false, error: match.reason }, { status: 400 })

    // Rate limits (privacy-safe: counted, never expose other users' data).
    const since15 = new Date(Date.now() - 15 * 60 * 1000)
    const sinceHour = new Date(Date.now() - 60 * 60 * 1000)
    const [userSends, emailSends, recentForEmail] = await Promise.all([
      prisma.companyOtpChallenge.count({ where: { userId: session.user.id, createdAt: { gte: since15 } } }),
      prisma.companyOtpChallenge.count({ where: { workEmail, createdAt: { gte: sinceHour } } }),
      prisma.companyOtpChallenge.findFirst({ where: { userId: session.user.id, workEmail, verified: false }, orderBy: { createdAt: "desc" } }),
    ])
    if (userSends >= OTP_MAX_SENDS_PER_USER_15MIN) {
      return NextResponse.json({ success: false, error: "Too many code requests. Try again in 15 minutes." }, { status: 429 })
    }
    if (emailSends >= OTP_MAX_SENDS_PER_EMAIL_HOUR) {
      return NextResponse.json({ success: false, error: "Too many codes sent to this inbox. Try again in an hour." }, { status: 429 })
    }
    if (recentForEmail && Date.now() - recentForEmail.createdAt.getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
      const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - (Date.now() - recentForEmail.createdAt.getTime()) / 1000)
      return NextResponse.json({ success: false, error: `Code just sent. Resend available in ${wait}s.`, data: { challengeId: recentForEmail.id, maskedEmail: maskEmail(workEmail) } }, { status: 429 })
    }

    const otp = generateOtp()
    const otpHash = await hashOtp(otp)
    const challenge = await prisma.companyOtpChallenge.create({
      data: {
        userId: session.user.id,
        companyId,
        pendingName,
        pendingWebsite,
        pendingDescription,
        workEmail,
        otpHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    })

    // Send inbox proof. Failures must not leak the code - code only goes via email.
    const sent = await sendCompanyVerificationOtp(workEmail, otp, companyName)
    if (!sent.success) {
      await prisma.companyOtpChallenge.delete({ where: { id: challenge.id } }).catch(() => {})
      return NextResponse.json({ success: false, error: "Could not send the code. Check the inbox address and retry." }, { status: 502 })
    }

    await writeAuditLog({
      action: "OTP_SEND",
      entity: "Company",
      entityId: companyId || `pending:${pendingName}`,
      userId: session.user.id,
      details: `Verification code sent to ${logEmail(workEmail)}`,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      data: { challengeId: challenge.id, maskedEmail: maskEmail(workEmail), expiresInMinutes: OTP_EXPIRY_MINUTES },
      message: `6-digit code sent to ${maskEmail(workEmail)}`,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
