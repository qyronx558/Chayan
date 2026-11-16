import { NextRequest, NextResponse } from "next/server"
import { requireSecret } from "@/lib/ingest/auth"
import { runDueFeeds } from "@/lib/private-jobs/feed-sync"
import { fillMissingLogos, scheduleLogoLookup } from "@/lib/private-jobs/logo"
import { runDiscovery } from "@/lib/private-jobs/discovery"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * GET (Bearer CRON_SECRET) - syncs the private-job feeds that are due
 * (Admin → Job feeds → Settings: master switch, interval, AI pages per call),
 * oldest first (5 boards at a time), then works through the discovery queue and
 * missing logos. Call it every 10-15 minutes from the external cron; each call
 * picks up where the previous one stopped.
 */
export async function GET(request: NextRequest) {
  const denied = requireSecret(request, "CRON_SECRET")
  if (denied) return denied
  const started = Date.now()
  const { ran, remaining, paused } = await runDueFeeds({ budgetMs: 38_000 })
  // Then companies queued in Admin → Job feeds → Discover: found boards become feeds.
  const discoveryBudget = Math.min(14_000, 48_000 - (Date.now() - started))
  const discovery =
    !paused && discoveryBudget > 8000
      ? await runDiscovery({ budgetMs: discoveryBudget, limit: 12, concurrency: 6 }).catch(() => null)
      : null
  if (discovery?.companyIds.length) scheduleLogoLookup(discovery.companyIds)
  const discoverySummary = discovery ? { checked: discovery.checked, found: discovery.found, added: discovery.added } : null
  // Spare time goes to finding real logos for companies that still show initials.
  const logoBudget = 52_000 - (Date.now() - started)
  const logos = logoBudget > 8000 ? await fillMissingLogos({ limit: 12, budgetMs: logoBudget }).catch(() => null) : null
  const logoSummary = logos ? { checked: logos.checked, found: logos.found } : null
  if (paused) return NextResponse.json({ success: true, paused: true, feeds: 0, remaining: 0, logos: logoSummary })
  const totals = ran.reduce(
    (acc, r) => {
      acc.created += r.stats.created
      acc.pendingReview += r.stats.pendingReview
      acc.updated += r.stats.updated
      acc.closed += r.stats.closed
      if (r.aiUsed) acc.aiPages += 1
      if (r.status === "ERROR" || r.status === "HELD") acc.problems += 1
      return acc
    },
    { created: 0, pendingReview: 0, updated: 0, closed: 0, aiPages: 0, problems: 0 }
  )
  return NextResponse.json({
    success: true,
    paused: false,
    feeds: ran.length,
    remaining,
    ...totals,
    logos: logoSummary,
    discovery: discoverySummary,
    results: ran.map((r) => ({ feedId: r.feedId, status: r.status, method: r.method, message: r.message, stats: r.stats })),
  })
}
