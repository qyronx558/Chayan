import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/roles"
import { maskUpi } from "@/lib/employer-earnings"

export async function GET() {
  try {
    const session = await auth()
    if (!session || !isAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const [payouts, referrals] = await Promise.all([
      prisma.payoutRequest.findMany({
        orderBy: { createdAt: "desc" }, take: 100,
        select: { id: true, amountPaise: true, upiSnapshot: true, status: true, createdAt: true, decidedAt: true, userId: true },
      }),
      prisma.employerReferral.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    ])
    const userIds = [...new Set([...payouts.map((p) => p.userId), ...referrals.flatMap((r) => [r.referrerUserId, r.referredUserId])])]
    const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    const nameOf = (id: string) => users.find((u) => u.id === id)
    return NextResponse.json({
      success: true,
      data: {
        payouts: payouts.map((p) => ({
          ...p,
          upiSnapshot: undefined,
          upiMasked: maskUpi(p.upiSnapshot),
          user: nameOf(p.userId) ? { name: nameOf(p.userId)!.name, email: nameOf(p.userId)!.email.replace(/(^.).*(@.*)$/, "$1***$2") } : null,
        })),
        referrals: referrals.map((r) => ({
          ...r,
          referrer: nameOf(r.referrerUserId)?.name || null,
          referred: nameOf(r.referredUserId)?.name || null,
        })),
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
