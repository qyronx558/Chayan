import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/location-api"
import { migrationHint } from "@/lib/ingest/admin"
import { writeAuditLog } from "@/lib/moderation"
import { queueCandidates, runDiscovery } from "@/lib/private-jobs/discovery"
import { scheduleLogoLookup } from "@/lib/private-jobs/logo"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const guard = () => requireSuperAdmin("Only super admins can manage job feeds")

/** GET → discovery queue counts and the latest checked companies. */
export async function GET() {
  const g = await guard()
  if (!g.ok) return g.response
  try {
    const [groups, recent] = await Promise.all([
      prisma.privateFeedCandidate.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.privateFeedCandidate.findMany({
        orderBy: [{ checkedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
        take: 60,
        select: { id: true, name: true, status: true, provider: true, boardToken: true, jobs: true, note: true, checkedAt: true },
      }),
    ])
    const counts = Object.fromEntries(groups.map((g) => [g.status, g._count._all]))
    return NextResponse.json({
      success: true,
      counts: { PENDING: 0, FOUND: 0, NOT_FOUND: 0, ERROR: 0, ...counts },
      data: recent,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: migrationHint(e) ?? "Failed to load discovery queue" }, { status: 500 })
  }
}

const schema = z.object({
  /** One company per line; optional website after "|" ("Acme | acme.com"). */
  names: z.string().max(200_000).optional(),
  /** Import only India & remote roles from boards found for these names. */
  indiaOnly: z.boolean().optional(),
  /** Run discovery now for up to ~45 s (otherwise the cron picks the queue up). */
  run: z.boolean().optional(),
  /** Put NOT_FOUND / ERROR companies back in the queue. */
  retry: z.boolean().optional(),
})

/** POST → queue company names and/or run discovery now. Found boards become enabled feeds. */
export async function POST(request: NextRequest) {
  const g = await guard()
  if (!g.ok) return g.response
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 })
  const { names, indiaOnly, run, retry } = parsed.data
  try {
    let queued = 0
    let skipped = 0
    if (names?.trim()) {
      const lines = names.split(/\r?\n/).slice(0, 5000)
      ;({ queued, skipped } = await queueCandidates(lines, { indiaOnly: indiaOnly ?? false, userId: g.user.id }))
    }
    if (retry) {
      const r = await prisma.privateFeedCandidate.updateMany({ where: { status: { in: ["NOT_FOUND", "ERROR"] } }, data: { status: "PENDING", attempts: 0 } })
      queued += r.count
    }
    const result = run ? await runDiscovery({ budgetMs: 45_000, limit: 80, concurrency: 8 }) : null
    if (result?.companyIds.length) scheduleLogoLookup(result.companyIds)
    if (queued || result?.added) {
      await writeAuditLog({
        action: "CREATE",
        entity: "PrivateFeedCandidate",
        entityId: "discovery",
        userId: g.user.id,
        details: `Queued ${queued} companies; discovery checked ${result?.checked ?? 0}, found ${result?.found ?? 0}, added ${result?.added ?? 0} boards`,
      })
    }
    return NextResponse.json({ success: true, queued, skipped, run: result })
  } catch (e) {
    return NextResponse.json({ success: false, error: migrationHint(e) ?? "Discovery failed" }, { status: 500 })
  }
}
