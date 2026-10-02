import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { maskUpi, COIN_RULES, coinsToPaise } from "@/lib/employer-earnings"

const accountSchema = z.object({
  upiId: z.string().trim().min(3).max(100).regex(/^[\w.\-]{2,}@[a-zA-Z]{2,}$/, "Enter a valid UPI ID (name@bank)"),
  accountHolder: z.string().trim().max(120).nullable().optional(),
})

const requestSchema = z.object({
  amountCoins: z.number().int().positive(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const [account, requests] = await Promise.all([
      prisma.payoutAccount.findUnique({ where: { userId: session.user.id } }),
      prisma.payoutRequest.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    ])
    return NextResponse.json({
      success: true,
      data: {
        account: account ? { upiMasked: maskUpi(account.upiId), accountHolder: account.accountHolder, updatedAt: account.updatedAt } : null,
        requests: requests.map((r) => ({ id: r.id, amountCoins: r.amountCoins, amountPaise: r.amountPaise, upiMasked: maskUpi(r.upiSnapshot), status: r.status, adminNote: r.adminNote, createdAt: r.createdAt, decidedAt: r.decidedAt })),
        minWithdrawCoins: COIN_RULES.MIN_WITHDRAW_COINS,
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    const v = accountSchema.safeParse(body)
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 })
    const account = await prisma.payoutAccount.upsert({
      where: { userId: session.user.id },
      update: { upiId: v.data.upiId.trim(), accountHolder: v.data.accountHolder || null },
      create: { userId: session.user.id, upiId: v.data.upiId.trim(), accountHolder: v.data.accountHolder || null },
    })
    return NextResponse.json({ success: true, data: { upiMasked: maskUpi(account.upiId) } })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    const v = requestSchema.safeParse(body)
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 })

    const account = await prisma.payoutAccount.findUnique({ where: { userId: session.user.id } })
    if (!account) return NextResponse.json({ success: false, error: "Add your UPI payout account first" }, { status: 400 })
    if (v.data.amountCoins < COIN_RULES.MIN_WITHDRAW_COINS) {
      return NextResponse.json({ success: false, error: `Minimum withdrawal is ${COIN_RULES.MIN_WITHDRAW_COINS} coins` }, { status: 400 })
    }

    // Withdrawable = APPROVED coins − already reserved. Recomputed server-side.
    const [ledgerSum, reserved] = await Promise.all([
      prisma.coinLedger.aggregate({
        where: { userId: session.user.id, status: { in: ["APPROVED", "PAID"] } },
        _sum: { coins: true },
      }),
      prisma.payoutRequest.aggregate({
        where: { userId: session.user.id, status: { in: ["PENDING", "APPROVED", "PAID"] } },
        _sum: { amountCoins: true },
      }),
    ])
    const withdrawable = Math.max(0, (ledgerSum._sum.coins || 0) - (reserved._sum.amountCoins || 0))
    if (v.data.amountCoins > withdrawable) {
      return NextResponse.json({ success: false, error: "Amount exceeds withdrawable coin balance" }, { status: 400 })
    }

    const req = await prisma.payoutRequest.create({
      data: { userId: session.user.id, amountCoins: v.data.amountCoins, amountPaise: coinsToPaise(v.data.amountCoins), upiSnapshot: account.upiId },
    })
    return NextResponse.json({ success: true, data: { id: req.id } }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
