/**
 * ChayanJobs ingest bot - finds new official notices and sends verified,
 * structured posts to POST /api/cron/ingest (moderation queue).
 *
 *   npx tsx scripts/ingest/run.ts --tier=central                 # all central sources
 *   npx tsx scripts/ingest/run.ts --tier=district --shard=2/4     # a quarter of the districts
 *   npx tsx scripts/ingest/run.ts --source=nic:bihar/patna --dry-run
 *
 * Env: INGEST_API_URL, INGEST_SECRET, GEMINI_API_KEY (and/or GROQ_API_KEY),
 *      INGEST_MAX_LLM_CALLS (default 120 per process), INGEST_MAX_PAGES (default 2),
 *      INGEST_MAX_AGE_DAYS (default 45), INGEST_MAX_NEW_PER_SOURCE (default 15).
 * --dry-run: no API calls; prints what would be sent (extraction still runs when a key is set).
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseListing } from "../../src/lib/ingest/adapters"
import { triageNotice } from "../../src/lib/ingest/classify"
import { createExtractor, llmConfig, type Extractor } from "../../src/lib/ingest/extract"
import { groundExtraction } from "../../src/lib/ingest/grounding"
import { isStaleListing, sha256, todayIST } from "../../src/lib/ingest/normalize"
import type { IngestPost } from "../../src/lib/ingest/schema"
import type { ListingItem, SourceDef } from "../../src/lib/ingest/types"
import { loadNotice } from "./documents"
import { politeGet } from "./http"
import pLimit from "p-limit"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SOURCES_DIR = path.join(HERE, "sources")

interface Args {
  tier?: "central" | "state" | "district"
  shard?: { k: number; n: number }
  source?: string
  dryRun: boolean
  limit: number
  maxPages: number
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
    limit: Number(get("limit") ?? process.env.INGEST_MAX_LLM_CALLS ?? 120),
    maxPages: Number(get("max-pages") ?? process.env.INGEST_MAX_PAGES ?? 2),
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

export function selectSources(all: SourceDef[], a: Pick<Args, "tier" | "shard" | "source">): SourceDef[] {
  if (a.source) return all.filter((s) => s.id === a.source)
  const level = a.tier?.toUpperCase()
  return all.filter((s) => (!level || s.level === level) && inShard(s.id, a.shard))
}

// ─── API client ─────────────────────────────────────────────────────

const MAX_AGE_DAYS = Number(process.env.INGEST_MAX_AGE_DAYS || 45)
const MAX_NEW_PER_SOURCE = Number(process.env.INGEST_MAX_NEW_PER_SOURCE || 15)
const API = (process.env.INGEST_API_URL || "").replace(/\/+$/, "")
const SECRET = process.env.INGEST_SECRET || ""

async function api<T>(method: "GET" | "POST", route: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}/api/cron/ingest${route}`, {
    method,
    headers: { authorization: `Bearer ${SECRET}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  })
  const json = (await res.json().catch(() => ({}))) as T & { success?: boolean; error?: string }
  if (!res.ok || json.success === false) throw new Error(`${route || "/"} → HTTP ${res.status}: ${json.error ?? "error"}`)
  return json
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

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const startedAt = new Date().toISOString()
  const today = todayIST()
  const log = (m: string) => console.log(m)
  if (!args.dryRun && (!API || !SECRET)) throw new Error("INGEST_API_URL and INGEST_SECRET are required (or pass --dry-run)")

  const sources = selectSources(loadSources(), args)
  log(`Ingest ${args.dryRun ? "(dry run) " : ""}- ${sources.length} source(s), LLM budget ${args.limit}`)
  if (!sources.length) return

  const tax = args.dryRun || !API
    ? { categories: ["Central Govt", "State Govt", "Banking", "Railways", "Defence", "Teaching", "Engineering", "Medical", "Police", "Judiciary", "Public Sector", "Research"], departments: [] as string[] }
    : await api<{ categories: string[]; departments: string[] }>("GET", "/taxonomy")

  let extractor: Extractor | null = null
  try {
    extractor = createExtractor(llmConfig())
  } catch (e) {
    if (!args.dryRun) throw e
    log(`  (no LLM key - dry run stops after listing + triage)`)
  }

  const stats = { listed: 0, relevant: 0, unseen: 0, extracted: 0, posted: 0, duplicate: 0, skipped: 0, failed: 0, errors: 0 }
  const errors: string[] = []
  const outbox: IngestPost[] = []
  const dryOut: unknown[] = []
  let budget = args.limit

  const flush = async () => {
    if (!outbox.length) return
    const batch = outbox.splice(0, outbox.length)
    if (args.dryRun) {
      dryOut.push(...batch)
      return
    }
    for (let i = 0; i < batch.length; i += 20) {
      const { results } = await api<{ results: { sourceUrl: string; status: string; reason?: string; moderation?: string }[] }>("POST", "", { items: batch.slice(i, i + 20) })
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
    if (!args.dryRun) {
      const { unseen: fresh } = await api<{ unseen: string[] }>("POST", "/seen", { urls: relevant.slice(0, 500).map((r) => r.url) })
      const set = new Set(fresh)
      unseen = relevant.filter((r) => set.has(r.url))
    }
    // Listings are newest-first: the cap keeps a big archive's first backfill from eating the budget.
    unseen = unseen.slice(0, MAX_NEW_PER_SOURCE)
    stats.unseen += unseen.length
    log(`  ${src.id}: ${items.length} listed, ${relevant.length} relevant, ${unseen.length} new`)
    if (!extractor) {
      dryOut.push(...unseen.map((u) => ({ ...u, triage: triageNotice(u.title, u.description) })))
      continue
    }

    for (const item of unseen) {
      if (budget <= 0) break
      try {
        const doc = await loadNotice(item.url)
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
        const local = doc.text ? groundExtraction(extraction, doc.text, links) : null
        log(`    + [${provider}] ${extraction.kind} "${extraction.title ?? item.title}"${local ? ` verified ${Math.round(local.verifiedRatio * 100)}%${local.dropped.length ? `, dropped ${local.dropped.join(",")}` : ""}` : " (scan - unverified)"}`)
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
  }
  await flush()

  const label = args.source ?? `${args.tier ?? "all"}${args.shard ? `-${args.shard.k}of${args.shard.n}` : ""}`
  log(`Done ${label}: ${JSON.stringify(stats)}`)
  if (args.dryRun) {
    const file = path.resolve("ingest-dry-run.json")
    writeFileSync(file, JSON.stringify(dryOut, null, 2))
    log(`Dry-run output written to ${file}`)
    return
  }
  await api("POST", "/run", {
    source: label,
    startedAt,
    imported: stats.posted,
    errors: stats.errors + stats.failed,
    detail: `${JSON.stringify(stats)}${errors.length ? `\n${errors.slice(0, 20).join("\n")}` : ""}`.slice(0, 4000),
  }).catch((e) => log(`  ! could not record run: ${e instanceof Error ? e.message : e}`))
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
