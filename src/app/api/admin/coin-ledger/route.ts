import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/roles"
import { COIN_RULES } from "@/lib/employer-earnings"

export async function GET() {
  try {
    const session = await auth()
    if (!session || !isAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const [pending, enrolled, payouts] = await Promise.all([
      prisma.coinLedger.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.rewardEnrollment.findMany({ orderBy: { createdAt: "desc" }, take: 200, select: { companyId: true, rewardedJobId: true, createdAt: true, userId: true } }),
      prisma.payoutRequest.aggregate({ where: { status: "PAID" }, _sum: { amountCoins: true } }),
    ])
    const userIds = [...new Set([...pending.map((p) => p.userId), ...enrolled.map((e) => e.userId)])]
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    const companyIds = [...new Set([
      ...pending.map((p) => p.companyId).filter((x): x is string => !!x),
      ...enrolled.map((e) => e.companyId),
    ])]
    const companies = await prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true, verifiedStatus: true },
    })
    const jobIds = [...new Set([
      ...pending.map((p) => p.jobId).filter((x): x is string => !!x),
      ...enrolled.map((e) => e.rewardedJobId).filter((x): x is string => !!x),
    ])]
    const jobs = await prisma.privateJob.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, title: true, slug: true, status: true, moderation: true, createdAt: true },
    })
    const mask = (email: string) => email.replace(/(^.).*(@.*)$/, "$1***$2")
    return NextResponse.json({
      success: true,
      data: {
        pilot: { enrolled: enrolled.length, cap: COIN_RULES.PILOT_MAX_COMPANIES, paidCoins: payouts._sum.amountCoins || 0 },
        pending: pending.map((p) => ({
          ...p,
          user: users.find((u) => u.id === p.userId) ? { name: users.find((u) => u.id === p.userId)!.name, email: mask(users.find((u) => u.id === p.userId)!.email) } : null,
          company: companies.find((c) => c.id === p.companyId) || null,
          job: jobs.find((j) => j.id === p.jobId) || null,
        })),
        enrolled: enrolled.map((e) => ({
          ...e,
          company: companies.find((c) => c.id === e.companyId) || null,
          job: jobs.find((j) => j.id === e.rewardedJobId) || null,
        })),
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
