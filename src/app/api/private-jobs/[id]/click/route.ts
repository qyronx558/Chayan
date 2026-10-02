import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sessionHash } from "@/lib/employer-earnings"

const KINDS = ["APPLY", "EMAIL", "DETAIL"] as const

function dayKey(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/**
 * Genuine-click beacon for employer earnings + analytics.
 * Privacy: stores salted session hash only (no raw IP/UA).
 * Dedupe: one count per session per job per kind per day.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const kind = String(body.kind || "APPLY").toUpperCase()
    if (!(KINDS as readonly string[]).includes(kind)) {
      return NextResponse.json({ success: false, error: "Invalid kind" }, { status: 400 })
    }
    const job = await prisma.privateJob.findUnique({ where: { id }, select: { id: true } })
    if (!job) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
    const ua = request.headers.get("user-agent") || null
    const day = dayKey()
    const hash = sessionHash(ip, ua, day.toISOString().slice(0, 10))

    await prisma.jobClick.upsert({
      where: { privateJobId_kind_sessionHash_day: { privateJobId: id, kind: kind as never, sessionHash: hash, day } },
      update: {},
      create: { privateJobId: id, kind: kind as never, sessionHash: hash, day },
    }).catch(() => {})
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
