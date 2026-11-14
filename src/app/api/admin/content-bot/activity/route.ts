import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireBotAdmin } from "@/lib/ingest/admin"

export const dynamic = "force-dynamic"

const STATUSES = ["POSTED", "SKIPPED", "DUPLICATE", "FAILED"] as const
const PAGE_SIZE = 50

/** GET ?status=&source=&page= → 24 h summary, recent bot runs and the per-notice log. */
export async function GET(request: NextRequest) {
  const guard = await requireBotAdmin()
  if (!guard.ok) return guard.response
  const sp = request.nextUrl.searchParams
  const status = STATUSES.find((s) => s === sp.get("status")) ?? null
  const source = sp.get("source")?.trim() || null
  const page = Math.max(1, Number(sp.get("page")) || 1)
  const since = new Date(Date.now() - 86400_000)
  const where = { ...(status ? { status } : {}), ...(source ? { sourceId: source } : {}) }

  const [byStatus, autoApproved, runs, items, total] = await Promise.all([
    prisma.ingestItem.groupBy({ by: ["status"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.ingestItem.count({ where: { autoApproved: true, createdAt: { gte: since } } }),
    prisma.crawlerRun.findMany({
      where: { source: { startsWith: "ingest:" } },
      orderBy: { startedAt: "desc" },
      take: 20,
      select: { id: true, source: true, startedAt: true, finishedAt: true, imported: true, errors: true, detail: true },
    }),
    prisma.ingestItem.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, sourceId: true, url: true, kind: true, status: true, reason: true,
        entityType: true, entityId: true, quality: true, confidence: true, autoApproved: true, attempts: true, updatedAt: true,
      },
    }),
    prisma.ingestItem.count({ where }),
  ])

  const last24h = Object.fromEntries(STATUSES.map((s) => [s.toLowerCase(), byStatus.find((b) => b.status === s)?._count._all ?? 0]))
  return NextResponse.json({ success: true, last24h: { ...last24h, autoApproved }, runs, items, total, page, pageSize: PAGE_SIZE })
}
