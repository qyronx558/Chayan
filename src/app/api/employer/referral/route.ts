import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateReferralCode } from "@/lib/employer-earnings"

function baseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "")
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

    let code = await prisma.employerReferralCode.findUnique({ where: { userId: session.user.id } })
    if (!code) {
      // Collision-safe create with retries.
      for (let i = 0; i < 5; i++) {
        try {
          code = await prisma.employerReferralCode.create({ data: { userId: session.user.id, code: generateReferralCode() } })
          break
        } catch { /* collision - retry */ }
      }
    }
    if (!code) return NextResponse.json({ success: false, error: "Could not issue code" }, { status: 500 })

    const [invites, confirmed, earned] = await Promise.all([
      prisma.employerReferral.count({ where: { referrerUserId: session.user.id } }),
      prisma.employerReferral.count({ where: { referrerUserId: session.user.id, status: { in: ["CONFIRMED", "REWARDED"] } } }),
      prisma.coinLedger.aggregate({
        where: { userId: session.user.id, kind: "REFERRAL_BONUS", status: { in: ["APPROVED", "PAID"] } },
        _sum: { coins: true },
      }),
    ])

    const recent = await prisma.employerReferral.findMany({
      where: { referrerUserId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, status: true, createdAt: true, confirmedAt: true, companyId: true, referredUserId: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        code: code.code,
        link: `${baseUrl()}/employer/jobs?ref=${code.code}`,
        invites,
        confirmed,
        earnedCoins: earned._sum.coins || 0,
        recent,
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
