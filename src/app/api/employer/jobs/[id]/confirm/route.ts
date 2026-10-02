import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { COIN_RULES } from "@/lib/employer-earnings"
import { writeAuditLog } from "@/lib/moderation"

/**
 * Employer-confirmed interview / hire (500 coins each, once per rewarded job).
 * Only the verified owner can confirm; awards land as PENDING for admin review.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const kind = body.kind === "hire" ? "HIRE_CONFIRMED" : body.kind === "interview" ? "INTERVIEW_CONFIRMED" : null
    if (!kind) return NextResponse.json({ success: false, error: "kind must be interview or hire" }, { status: 400 })

    const job = await prisma.privateJob.findUnique({ where: { id }, select: { id: true, companyId: true, title: true } })
    if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })

    const member = await prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId: job.companyId, userId: session.user.id } },
      select: { verified: true },
    }).catch(() => null)
    const company = await prisma.company.findUnique({ where: { id: job.companyId }, select: { verifiedStatus: true } })
    if (!member?.verified || company?.verifiedStatus !== "VERIFIED") {
      return NextResponse.json({ success: false, error: "Only the OTP-verified owner can confirm" }, { status: 403 })
    }

    const enrollment = await prisma.rewardEnrollment.findUnique({ where: { companyId: job.companyId } })
    if (!enrollment || (enrollment.rewardedJobId && enrollment.rewardedJobId !== job.id)) {
      return NextResponse.json({ success: false, error: "Only the company's one rewarded pilot job earns coins" }, { status: 403 })
    }
    if (!enrollment.rewardedJobId) {
      await prisma.rewardEnrollment.update({ where: { companyId: job.companyId }, data: { rewardedJobId: job.id } })
    }

    const existing = await prisma.coinLedger.findFirst({ where: { kind: kind as never, companyId: job.companyId, jobId: job.id }, select: { id: true } })
    if (existing) return NextResponse.json({ success: false, error: "Already confirmed for this job" }, { status: 409 })

    const coins = kind === "HIRE_CONFIRMED" ? COIN_RULES.HIRE_COINS : COIN_RULES.INTERVIEW_COINS
    const row = await prisma.coinLedger.create({
      data: {
        userId: session.user.id, companyId: job.companyId, jobId: job.id,
        kind: kind as never, coins, status: "PENDING",
        note: kind === "HIRE_CONFIRMED" ? "Employer-confirmed hire" : "Employer-confirmed interview",
      },
    })
    if (kind === "INTERVIEW_CONFIRMED") {
      await prisma.privateApplication.updateMany({ where: { privateJobId: job.id, status: "applied" }, data: { status: "interview" } }).catch(() => {})
    }
    if (kind === "HIRE_CONFIRMED") {
      await prisma.privateApplication.updateMany({ where: { privateJobId: job.id, status: "interview" }, data: { status: "offer" } }).catch(() => {})
    }

    await writeAuditLog({ action: kind, entity: "PrivateJob", entityId: job.id, userId: session.user.id, details: `${kind} confirmed, ${coins} coins pending review` }).catch(() => {})
    return NextResponse.json({ success: true, data: row, message: `${coins} coins submitted for review` }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
