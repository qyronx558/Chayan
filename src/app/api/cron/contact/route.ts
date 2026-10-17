import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { deliverContactTicket } from "@/lib/contact-delivery"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const actual = Buffer.from(request.headers.get("authorization") || "")
  const expected = Buffer.from(`Bearer ${secret}`)
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }
  try {
    const now = new Date()
    const tickets = await prisma.contactTicket.findMany({
      where: { nextAttemptAt: { lte: now }, deliveryAttempts: { lt: 10 },
        createdAt: { gt: new Date(now.getTime() - 23 * 60 * 60 * 1000) },
        OR: [{ notifiedAt: null }, { autoRepliedAt: null }] },
      select: { id: true }, orderBy: { createdAt: "asc" }, take: 10,
    })
    const results = await Promise.allSettled(tickets.map(({ id }) => deliverContactTicket(id)))
    const failed = results.filter((result) => result.status === "rejected" || !result.value).length
    await prisma.contactRateLimit.deleteMany({ where: { expiresAt: { lt: now } } })
    return NextResponse.json({ success: failed === 0, processed: tickets.length, failed },
      { status: failed ? 503 : 200, headers: { "Cache-Control": "no-store" } })
  } catch {
    console.error("[contact-cron] Retry failed")
    return NextResponse.json({ success: false, error: "Contact retry failed" }, { status: 503 })
  }
}
