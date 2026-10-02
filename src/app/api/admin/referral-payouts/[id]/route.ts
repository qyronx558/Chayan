import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/roles"
import { writeAuditLog } from "@/lib/moderation"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !isAdmin(session.user.role)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const { action, adminNote } = await request.json()
    if (!["APPROVED", "PAID", "REJECTED"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
    const payout = await prisma.payoutRequest.findUnique({ where: { id } })
    if (!payout) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })

    const updated = await prisma.payoutRequest.update({
      where: { id },
      data: { status: action, adminNote: adminNote || null, decidedAt: new Date() },
    })

    // On PAID, mark matching APPROVED coin rows as PAID (FIFO by coins).
    if (action === "PAID" && payout.amountCoins) {
      let remaining = payout.amountCoins
      const rows = await prisma.coinLedger.findMany({
        where: { userId: payout.userId, status: "APPROVED" },
        orderBy: { createdAt: "asc" },
      })
      for (const row of rows) {
        if (remaining <= 0) break
        if (row.coins <= remaining) {
          await prisma.coinLedger.update({ where: { id: row.id }, data: { status: "PAID" } })
          remaining -= row.coins
        }
      }
    }

    await writeAuditLog({
      action: `PAYOUT_${action}`,
      entity: "PayoutRequest",
      entityId: id,
      userId: session.user.id,
      details: `${action} payout ${id} amount=${payout.amountPaise}`,
    }).catch(() => {})

    return NextResponse.json({ success: true, data: updated })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
