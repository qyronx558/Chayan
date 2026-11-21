/**
 * ChayanJobs ingest bot - finds new official notices and stores verified,
 * structured posts in the moderation queue.
 *
 * With DATABASE_URL set (GitHub Actions) it writes straight to the database through
 * the same library code the site uses, and only calls the site once at the end to
 * refresh pages for auto-approved posts: no Vercel compute per notice. Without it
 * (or INGEST_TRANSPORT=http) it posts to /api/cron/ingest as before.
 *
 *   npx tsx scripts/ingest/run.ts --tier=central                 # all central sources
 *   npx tsx scripts/ingest/run.ts --tier=district --shard=2/4     # a quarter of the districts
 *   npx tsx scripts/ingest/run.ts --source=nic:bihar/patna --dry-run
 *
 * Env: DATABASE_URL + APP_URL + CRON_SECRET (direct) or INGEST_API_URL + INGEST_SECRET (http),
 *      GEMINI_API_KEY (and/or GROQ_API_KEY),
 *      INGEST_MAX_LLM_CALLS (default 120 per process), INGEST_MAX_PAGES (default 2),
 *      INGEST_MAX_AGE_DAYS (default 45), INGEST_MAX_NEW_PER_SOURCE (default 15).
 * Admin → Content bot settings (read from /api/cron/ingest/config) override the env:
 * master switch + tier switches (scheduled runs only), source on/off, custom sources,
 * limits and the Gemini model.
 * --dry-run: posts nothing (still reads the admin settings when the API is configured).
 * --scheduled (or INGEST_SCHEDULED=true): honour the admin pause / tier switches.
 */
import "./env" // must stay first: loads .env before other modules read process.env
import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseListing } from "../../src/lib/ingest/adapters"
import { triageNotice } from "../../src/lib/ingest/classify"
import { applySourceOverrides, tierEnabled, type BotRuntimeConfig } from "../../src/lib/ingest/control"
import { createExtractor, llmConfig, LlmUnavailableError, type Extractor } from "../../src/lib/ingest/extract"
import { groundExtraction } from "../../src/lib/ingest/grounding"
import { isStaleListing, sha256, todayIST } from "../../src/lib/ingest/normalize"
import type { IngestPost } from "../../src/lib/ingest/schema"
import type { IngestKind, ListingItem, SourceDef } from "../../src/lib/ingest/types"
import { loadNotice } from "./documents"
import { politeGet, RobotsDisallowed } from "./http"
import { directTransport, httpTransport, wantsDirect, type IngestTransport, type Published } from "./transport"
import { revalidateSite, slugsFor } from "./site"
import pLimit from "p-limit"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SOURCES_DIR = path.join(HERE, "sources")

interface Args {
  tier?: "central" | "state" | "district"
  shard?: { k: number; n: number }
  source?: string
  dryRun: boolean
  /** Explicit --limit; otherwise the admin setting / env decides. */
  limit?: number
  maxPages: number
  scheduled: boolean
}

export function parseArgs(argv: string[]): Args {
  const get = (name: string) => argv.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=")
  const shard = get("shard")?.match(/^(\d+)\/(\d+)$/)
  const tier = get("tier")
  if (tier && !["central", "state", "district"].includes(tier)) throw new Error(`unknown --tier=${tier}`)
  return {
    tier: tier as Args["tier"],
    shard: shard ? { k: Number(shard[1]), n: Number(shard[2]) } : undefined,
    source: get("source"),
    dryRun: argv.includes("--dry-run"),
    limit: get("limit") ? Number(get("limit")) : undefined,
    maxPages: Number(get("max-pages") ?? process.env.INGEST_MAX_PAGES ?? 2),
    scheduled: argv.includes("--scheduled") || process.env.INGEST_SCHEDULED === "true",
  }
}

export function loadSources(dir = SOURCES_DIR): SourceDef[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as SourceDef[])
    .filter((s) => !s.disabled)
}

/** Stable shard assignment: a source always lands in the same shard. */
export function inShard(id: string, shard?: { k: number; n: number }): boolean {
  if (!shard) return true
  return (parseInt(sha256(id).slice(0, 8), 16) % shard.n) + 1 === shard.k
}

/** An explicit --source runs even when that source is switched off; tiers skip disabled sources. */
export function selectSources(all: SourceDef[], a: Pick<Args, "tier" | "shard" | "source">): SourceDef[] {
  if (a.source) return all.filter((s) => s.id === a.source)
  const level = a.tier?.toUpperCase()
  return all.filter((s) => !s.disabled && (!level || s.level === level) && inShard(s.id, a.shard))
}

// ─── API client ─────────────────────────────────────────────────────

const MAX_AGE_DAYS = Number(process.env.INGEST_MAX_AGE_DAYS || 45)
let API = (process.env.INGEST_API_URL || "").replace(/\/+$/, "")
const SECRET = process.env.INGEST_SECRET || ""

const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, "")

/**
 * Follows the site's own redirects (e.g. chayanjobs.com → www.chayanjobs.com)
 * once, up front. fetch() drops the Authorization header when a redirect
 * changes the host, so every later call must go straight to the final address.
 * Only http→https and apex↔www hops are followed - the secret never leaves the site.
 */
export async function resolveApiBase(base: string, fetchFn: typeof fetch = fetch): Promise<string> {
  let url = base.replace(/\/+$/, "")
  for (let hop = 0; hop < 5; hop++) {
    const res = await fetchFn(`${url}/api/cron/ingest/config`, { redirect: "manual", signal: AbortSignal.timeout(30_000) })
    const location = res.headers.get("location")
    if (res.status < 300 || res.status >= 400 || !location) return url
    const from = new URL(url)
    const to = new URL(location, `${url}/`)
    if (bareHost(to.hostname) !== bareHost(from.hostname)) {
      throw new Error(`${url} redirects to another site (${to.origin}) - set INGEST_API_URL / APP_URL to the real site address`)
    }
    url = `${to.origin}${from.pathname.replace(/\/+$/, "")}`
  }
  return url
}

async function api<T>(method: "GET" | "POST", route: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}/api/cron/ingest${route}`, {
    method,
    headers: { authorization: `Bearer ${SECRET}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "error", // a redirect here would silently drop the secret - resolveApiBase() handles them
    signal: AbortSignal.timeout(90_000),
  })
  const json = (await res.json().catch(() => ({}))) as T & { success?: boolean; error?: string }
  if (res.status === 401) {
    throw new Error(
      `${route || "/"} → HTTP 401: the site rejected INGEST_SECRET. The GitHub secret ` +
        `(INGEST_SECRET, or DEV_INGEST_SECRET for target=dev) must be exactly the same as INGEST_SECRET in ` +
        `Vercel for that environment - and Vercel must be redeployed after changing it.`,
    )
  }
  if (res.status === 500 && json.error?.includes("not configured")) {
    throw new Error(`${route || "/"} → ${json.error} on the site: add INGEST_SECRET in Vercel and redeploy.`)
  }
  if (!res.ok || json.success === false) throw new Error(`${route || "/"} → HTTP ${res.status}: ${json.error ?? "error"}`)
  return json
}

/**
 * One line per host whose robots.txt blocked notices. S3WaaS district PDFs live on
 * cdn.s3waas.gov.in, which serves "Disallow: /" to visitors outside India (GitHub's
 * runners are in the US) and no restriction inside India.
 */
export function robotsNote(host: string, count: number): string {
  const base = `robots.txt on ${host} does not allow this bot to read ${count} notice file(s) - left unread, retried next run.`
  return /(^|\.)s3waas\.gov\.in$/.test(host)
    ? `${base} This host only blocks visitors outside India: run the district tier from a machine in India (docs/content-ingest.md → "District PDFs").`
    : base
}

// ─── pipeline ───────────────────────────────────────────────────────

async function harvest(src: SourceDef, maxPages: number, log: (m: string) => void): Promise<ListingItem[]> {
  const items: ListingItem[] = []
  for (const start of [src.url, ...(src.extraUrls ?? [])]) {
    let url: string | null = start
    for (let page = 0; url && page < maxPages; page++) {
      const res = await politeGet(url)
      if (res.status >= 400) {
        log(`  ! ${src.id}: HTTP ${res.status} ${url}`)
        break
      }
      const parsed = parseListing(src, res.body.toString("utf8"), res.url)
      items.push(...parsed.items)
      if (parsed.empty) break
      url = parsed.nextPage
    }
  }
  const byUrl = new Map(items.map((i) => [i.url, i]))
  return [...byUrl.values()]
}

export function publishedFrom(batch: IngestPost[], results: { status: string; moderation?: string; entityId?: string }[]): Published[] {
  return results.flatMap((r, i) =>
    r.status === "POSTED" && r.moderation === "APPROVED" && r.entityId && batch[i] && batch[i].extraction.kind !== "irrelevant"
      ? [{ kind: batch[i].extraction.kind as IngestKind, entityId: r.entityId }]
      : [],
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const log = (m: string) => console.log(m)
  if (wantsDirect()) {
    const transport = await directTransport()
    try {
      await pipeline(args, transport, log)
    } finally {
      await transport.close()
    }
    return
  }
  if (!args.dryRun && (!API || !SECRET)) {
    throw new Error(
      `Missing ${[!API && "INGEST_API_URL", !SECRET && "INGEST_SECRET"].filter(Boolean).join(" and ")}. ` +
        `Add them to .env (e.g. INGEST_API_URL="http://127.0.0.1:3000") or pass --dry-run.`,
    )
  }
  if (API) {
    const resolved = await resolveApiBase(API).catch((e) => {
      if (!args.dryRun) throw e
      log(`  (site not reachable: ${e instanceof Error ? e.message : e})`)
      return API
    })
    if (resolved !== API) log(`Note: ${API} redirects to ${resolved} - using that. Set APP_URL to ${resolved} to skip the redirect.`)
    API = resolved
  }
  await pipeline(args, API && SECRET ? httpTransport(api) : null, log)
}

async function pipeline(args: Args, transport: IngestTransport | null, log: (m: string) => void) {
  const startedAt = new Date().toISOString()
  const today = todayIST()
  const target = args.dryRun ? "(dry run - nothing is sent)" : transport?.mode === "direct" ? "database (direct)" : API
  log(`Target: ${target} | LLM: ${process.env.GEMINI_API_KEY ? "gemini" : ""}${process.env.GROQ_API_KEY ? " groq" : ""}`)

  let config: BotRuntimeConfig | null = null
  if (transport) {
    try {
      config = await transport.config()
    } catch (e) {
      if (!args.dryRun) throw e
      log(`  (admin settings not reachable - using .env defaults: ${e instanceof Error ? e.message : e})`)
    }
  }
  if (config && args.scheduled && !config.settings.enabled) {
    log("Content bot is paused in Admin → Content bot - nothing to do.")
    return
  }

  let all = applySourceOverrides(loadSources(), config?.sources ?? [])
  if (config && args.scheduled && !args.source) {
    const off = (["CENTRAL", "STATE", "DISTRICT"] as const).filter((lv) => !tierEnabled(config.settings, lv))
    if (off.length) log(`  tiers switched off in admin: ${off.join(", ")}`)
    all = all.filter((s) => tierEnabled(config.settings, s.level))
  }
  const sources = selectSources(all, args)
  const llmBudget = args.limit ?? config?.settings.maxLlmCalls ?? Number(process.env.INGEST_MAX_LLM_CALLS || 120)
  const maxNewPerSource = config?.settings.maxNewPerSource ?? Number(process.env.INGEST_MAX_NEW_PER_SOURCE || 15)
  const model = config?.settings.geminiModel || undefined
  log(`Ingest ${args.dryRun ? "(dry run) " : ""}- ${sources.length} source(s), LLM budget ${llmBudget}, max ${maxNewPerSource} new per source${model ? `, model ${model} (admin)` : ""}`)
  if (!sources.length) return

  const tax = args.dryRun || !transport
    ? { categories: ["Central Govt", "State Govt", "Banking", "Railways", "Defence", "Teaching", "Engineering", "Medical", "Police", "Judiciary", "Public Sector", "Research"], departments: [] as string[] }
    : await transport.taxonomy()

  let extractor: Extractor | null = null
  try {
    extractor = createExtractor(llmConfig(model ? { ...process.env, GEMINI_MODEL: model } : process.env))
  } catch (e) {
    if (!args.dryRun) throw e
    log(`  (no LLM key - dry run stops after listing + triage)`)
  }

  const stats = { listed: 0, relevant: 0, unseen: 0, extracted: 0, posted: 0, duplicate: 0, skipped: 0, failed: 0, errors: 0, blocked: 0 }
  /** Hosts whose robots.txt forbids this bot - their notices stay unread (retried next run), never counted as errors. */
  const blockedHosts = new Map<string, number>()
  const errors: string[] = []
  const outbox: IngestPost[] = []
  const dryOut: unknown[] = []
  const published: Published[] = []
  let budget = llmBudget
  // Stop extracting before the CI job's timeout (45 min) kills the process:
  // a killed run loses every extracted post still waiting in the outbox.
  // Whatever is left stays unseen and is picked up by the next run.
  const deadline = Date.now() + (Number(process.env.INGEST_TIME_BUDGET_MS) || 30 * 60_000)
  let stopReason: string | null = null

  const flush = async () => {
    if (!outbox.length) return
    const batch = outbox.splice(0, outbox.length)
    if (args.dryRun || !transport) {
      dryOut.push(...batch)
      return
    }
    for (let i = 0; i < batch.length; i += 20) {
      const chunk = batch.slice(i, i + 20)
      const results = await transport.ingest(chunk)
      published.push(...publishedFrom(chunk, results))
      for (const r of results) {
        const k = r.status.toLowerCase() as "posted" | "duplicate" | "skipped" | "failed"
        stats[k]++
        log(`    ${r.status}${r.moderation ? `/${r.moderation}` : ""} ${r.reason ? `(${r.reason}) ` : ""}${r.sourceUrl}`)
      }
    }
  }

  // Phase 1 - listing pages, in parallel across hosts (each host is still throttled to 1 req / 2s).
  const limit = pLimit(Number(process.env.INGEST_HOST_CONCURRENCY || 8))
  const harvested = await Promise.all(
    sources.map((src) =>
      limit(async () => {
        try {
          return { src, items: await harvest(src, args.maxPages, log) }
        } catch (e) {
          stats.errors++
          errors.push(`${src.id}: ${e instanceof Error ? e.message : e}`)
          log(`  ! ${src.id}: ${e instanceof Error ? e.message : e}`)
          return { src, items: [] as ListingItem[] }
        }
      }),
    ),
  )

  // Phase 2 - triage, dedupe, extract (sequential: one LLM key, per-minute limits).
  for (const { src, items } of harvested) {
    stats.listed += items.length

    // Triage + stale/expired filter before spending anything.
    const relevant = items.filter((it) => !isStaleListing(it, today, MAX_AGE_DAYS) && triageNotice(it.title, it.description).relevant)
    stats.relevant += relevant.length
    if (!relevant.length) continue

    let unseen = relevant
    if (!args.dryRun && transport) {
      const set = new Set(await transport.seen(relevant.slice(0, 500).map((r) => r.url)))
      unseen = relevant.filter((r) => set.has(r.url))
    }
    // Listings are newest-first: the cap keeps a big archive's first backfill from eating the budget.
    unseen = unseen.slice(0, maxNewPerSource)
    stats.unseen += unseen.length
    log(`  ${src.id}: ${items.length} listed, ${relevant.length} relevant, ${unseen.length} new`)
    if (!extractor) {
      dryOut.push(...unseen.map((u) => ({ ...u, triage: triageNotice(u.title, u.description) })))
      continue
    }

    for (const item of unseen) {
      if (budget <= 0 || stopReason) break
      if (Date.now() > deadline) {
        stopReason = "time budget used up"
        break
      }
      try {
        const t0 = Date.now()
        const doc = await loadNotice(item.url)
        const t1 = Date.now()
        const links = [...item.links, ...doc.links]
        budget--
        const { extraction, provider } = await extractor.extract({
          source: src,
          item,
          text: doc.text,
          pdf: doc.pdfBase64 ? { base64: doc.pdfBase64 } : null,
          categories: tax.categories,
          departments: tax.departments,
          today,
        })
        stats.extracted++
        const timing = `${((t1 - t0) / 1000).toFixed(1)}s fetch, ${((Date.now() - t1) / 1000).toFixed(1)}s llm`
        const local = doc.text ? groundExtraction(extraction, doc.text, links) : null
        log(`    + [${provider}] ${extraction.kind} "${extraction.title ?? item.title}"${local ? ` verified ${Math.round(local.verifiedRatio * 100)}%${local.dropped.length ? `, dropped ${local.dropped.join(",")}` : ""}` : " (scan - unverified)"} [${timing}]`)
        outbox.push({
          sourceId: src.id,
          sourceUrl: item.url,
          officialNotification: doc.isPdf ? doc.finalUrl : (links.find((l) => /\.pdf(\?|$)/i.test(l.url))?.url ?? doc.finalUrl),
          level: src.level,
          state: src.state ?? null,
          district: src.district ?? null,
          allowHosts: src.allowHosts,
          sourceText: doc.text.slice(0, 40_000),
          links: links.slice(0, 60).map((l) => ({ url: l.url.slice(0, 1000), label: l.label.slice(0, 300) })),
          extraction: { ...extraction, department: extraction.department ?? src.department ?? null },
        })
        if (outbox.length >= 20) await flush()
      } catch (e) {
        if (e instanceof LlmUnavailableError) {
          // Every remaining notice would fail the same way: end the run now.
          stopReason = e.message
          break
        }
        if (e instanceof RobotsDisallowed) {
          const host = new URL(item.url).host
          stats.blocked++
          blockedHosts.set(host, (blockedHosts.get(host) ?? 0) + 1)
          continue
        }
        stats.errors++
        const msg = `${item.url}: ${e instanceof Error ? e.message : e}`
        errors.push(msg)
        log(`    ! ${msg}`)
      }
    }
    if (budget <= 0) {
      log(`  LLM budget used up - remaining notices are picked up next run`)
      break
    }
    if (stopReason) {
      stats.errors++
      errors.push(`stopped early: ${stopReason}`)
      log(`  Stopped early (${stopReason}) - remaining notices are picked up next run`)
      break
    }
  }
  await flush()

  for (const [host, n] of blockedHosts) {
    const note = robotsNote(host, n)
    errors.push(note)
    log(`  ${note}`)
  }

  const label = args.source ?? `${args.tier ?? "all"}${args.shard ? `-${args.shard.k}of${args.shard.n}` : ""}`
  log(`Done ${label}: ${JSON.stringify(stats)}`)
  if (args.dryRun || !transport) {
    const file = path.resolve("ingest-dry-run.json")
    writeFileSync(file, JSON.stringify(dryOut, null, 2))
    log(`Dry-run output written to ${file}`)
    return
  }
  await transport
    .report({
      source: label,
      startedAt,
      imported: stats.posted,
      errors: stats.errors + stats.failed,
      detail: `${JSON.stringify(stats)}${errors.length ? `\n${errors.slice(0, 20).join("\n")}` : ""}`.slice(0, 4000),
    })
    .catch((e) => log(`  ! could not record run: ${e instanceof Error ? e.message : e}`))
  if (transport.mode === "direct" && published.length) {
    log(`Published ${published.length} post(s) - refreshing their pages`)
    await revalidateSite(await slugsFor(published), log).catch((e) => log(`  ! revalidate: ${e instanceof Error ? e.message : e}`))
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
