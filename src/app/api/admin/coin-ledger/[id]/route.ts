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
    if (!["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
    const row = await prisma.coinLedger.findUnique({ where: { id } })
    if (!row) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    if (row.status !== "PENDING") return NextResponse.json({ success: false, error: "Already decided" }, { status: 409 })

    const updated = await prisma.coinLedger.update({
      where: { id },
      data: { status: action, ...(adminNote ? { note: `${row.note || ""} | admin: ${adminNote}`.slice(0, 500) } : {}) },
    })
    await writeAuditLog({
      action: `COIN_${action}`,
      entity: "CoinLedger",
      entityId: id,
      userId: session.user.id,
      details: `${action} ${row.coins} coins (${row.kind}) for user ${row.userId}`,
    }).catch(() => {})
    return NextResponse.json({ success: true, data: updated })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
