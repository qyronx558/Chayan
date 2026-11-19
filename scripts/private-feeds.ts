import "./ingest/env"
import { runDueFeeds } from "../src/lib/private-jobs/feed-sync"
import { fillMissingLogos } from "../src/lib/private-jobs/logo"
import { runDiscovery } from "../src/lib/private-jobs/discovery"
import { prisma } from "../src/lib/prisma"

const FEED_BUDGET_MS = Number(process.env.FEEDS_BUDGET_MS) || 8 * 60_000
const DISCOVERY_BUDGET_MS = Number(process.env.FEEDS_DISCOVERY_BUDGET_MS) || 2 * 60_000
const LOGO_BUDGET_MS = Number(process.env.FEEDS_LOGO_BUDGET_MS) || 2 * 60_000

async function notifySite() {
  const base = (process.env.APP_URL || process.env.INGEST_API_URL || "").replace(/\/+$/, "")
  const secret = process.env.CRON_SECRET
  if (!base || !secret) {
    console.warn("APP_URL or CRON_SECRET missing: skipped page revalidation")
    return
  }
  const site = new URL((await fetch(`${base}/`, { method: "HEAD", redirect: "follow" })).url).origin
  const res = await fetch(`${site}/api/cron/revalidate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "private-job" }),
  })
  console.log(`revalidate: ${res.status}`)
}

async function main() {
  const { ran, remaining, paused } = await runDueFeeds({ budgetMs: FEED_BUDGET_MS, revalidate: false })
  if (paused) {
    console.log("Feed sync is paused in Admin → Job feeds")
    return
  }
  const discovery = await runDiscovery({ budgetMs: DISCOVERY_BUDGET_MS, limit: 40, concurrency: 6 }).catch(() => null)
  const logos = await fillMissingLogos({ limit: 40, budgetMs: LOGO_BUDGET_MS }).catch(() => null)
  const changed = ran.reduce((n, r) => n + r.stats.created + r.stats.updated + r.stats.reopened + r.stats.closed, 0)
  console.log(
    JSON.stringify({
      feeds: ran.length,
      remaining,
      changed,
      problems: ran.filter((r) => r.status === "ERROR" || r.status === "HELD").length,
      discovery: discovery ? { checked: discovery.checked, found: discovery.found, added: discovery.added } : null,
      logos: logos ? { checked: logos.checked, found: logos.found } : null,
    })
  )
  if (changed > 0 || (discovery?.added ?? 0) > 0 || (logos?.found ?? 0) > 0) await notifySite()
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
