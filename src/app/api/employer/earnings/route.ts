import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { COIN_RULES, coinsToPaise, formatINR } from "@/lib/employer-earnings"
import { evaluateCompanyMilestones } from "@/lib/employer-earnings"

/**
 * Coin wallet: PENDING (in review) vs APPROVED (withdrawable).
 * Views / clicks / partial applications are display-only metrics - never paid.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    const members = await prisma.companyMember.findMany({
      where: { userId, verified: true },
      select: { companyId: true, company: { select: { verifiedStatus: true } } },
    })
    const companyIds = members.filter((m) => m.company.verifiedStatus === "VERIFIED").map((m) => m.companyId)

    // Metrics for display only.
    let views = 0
    let applyClicks = 0
    let emailClicks = 0
    let partialApps = 0
    if (companyIds.length > 0) {
      const [viewAgg, clickGroups, appGroups] = await Promise.all([
        prisma.privateJobView.aggregate({ where: { privateJob: { companyId: { in: companyIds } } }, _sum: { views: true } }),
        prisma.jobClick.groupBy({ by: ["kind"], where: { privateJob: { companyId: { in: companyIds } } }, _count: true }),
        prisma.privateApplication.groupBy({ by: ["status"], where: { privateJob: { companyId: { in: companyIds } } }, _count: true }),
      ])
      views = viewAgg._sum.views || 0
      for (const g of clickGroups) {
        if (g.kind === "APPLY") applyClicks = g._count
        if (g.kind === "EMAIL") emailClicks = g._count
      }
      partialApps = appGroups.filter((g) => g.status === "saved").reduce((s, g) => s + g._count, 0)
    }

    // Auto-check milestones on wallet open (idempotent; new awards land as PENDING).
    const progress: Record<string, unknown> = {}
    for (const id of companyIds.slice(0, 10)) {
      const r = await evaluateCompanyMilestones(id).catch(() => null)
      if (r?.progress) progress[id] = { ...r.progress }
    }

    const [ledger, reserved] = await Promise.all([
      prisma.coinLedger.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.payoutRequest.aggregate({ where: { userId, status: { in: ["PENDING", "APPROVED", "PAID"] } }, _sum: { amountCoins: true } }),
    ])
    const approvedCoins = ledger.filter((l) => l.status === "APPROVED" || l.status === "PAID").reduce((s, l) => s + l.coins, 0)
    const pendingCoins = ledger.filter((l) => l.status === "PENDING").reduce((s, l) => s + l.coins, 0)
    const reservedCoins = reserved._sum.amountCoins || 0
    const withdrawableCoins = Math.max(0, approvedCoins - reservedCoins)

    return NextResponse.json({
      success: true,
      data: {
        coins: { approved: approvedCoins, pending: pendingCoins, withdrawable: withdrawableCoins },
        rupees: {
          approved: formatINR(coinsToPaise(approvedCoins)),
          withdrawable: formatINR(coinsToPaise(withdrawableCoins)),
        },
        metrics: { views, applyClicks, emailClicks, partialApps, displayOnly: true },
        progress,
        minWithdrawCoins: COIN_RULES.MIN_WITHDRAW_COINS,
        canWithdraw: withdrawableCoins >= COIN_RULES.MIN_WITHDRAW_COINS,
        coinToCash: `1,000 coins = ₹${COIN_RULES.COINS_PER_1000_TO_RUPEES}`,
        ledger: ledger.map((l) => ({ id: l.id, kind: l.kind, coins: l.coins, rupees: formatINR(coinsToPaise(l.coins)), status: l.status, note: l.note, createdAt: l.createdAt })),
        rules: {
          live7d: COIN_RULES.JOB_LIVE_7D_COINS,
          threeApps: COIN_RULES.THREE_APPS_COINS,
          interview: COIN_RULES.INTERVIEW_COINS,
          hire: COIN_RULES.HIRE_COINS,
          referral: COIN_RULES.REFERRAL_COINS,
        },
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
