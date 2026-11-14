/**
 * Health check for crawl sources: fetches each listing page (same polite
 * client as the bot - robots.txt, throttling) and reports how many notices
 * the adapter found and how many pass triage. No LLM call, nothing is posted.
 *
 *   npx tsx scripts/ingest/check-sources.ts --tier=central
 *   npx tsx scripts/ingest/check-sources.ts --file=path/to/candidates.json
 *   npx tsx scripts/ingest/check-sources.ts --source=upsc --verbose
 *
 * A source is OK when its page loads and at least one relevant notice is found.
 * --json=out.json writes the full report (used when adding sources in bulk).
 */
import "./env" // must stay first: loads .env before other modules read process.env
import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pLimit from "p-limit"
import { parseListing } from "../../src/lib/ingest/adapters"
import { triageNotice } from "../../src/lib/ingest/classify"
import type { SourceDef } from "../../src/lib/ingest/types"
import { politeGet } from "./http"

const HERE = path.dirname(fileURLToPath(import.meta.url))

export interface SourceHealth {
  id: string
  ok: boolean
  status: number | null
  listed: number
  relevant: number
  error?: string
  samples: string[]
}

export async function checkSource(src: SourceDef): Promise<SourceHealth> {
  const base = { id: src.id, status: null, listed: 0, relevant: 0, samples: [] as string[] }
  try {
    let listed = 0
    let relevant = 0
    let status = 0
    const samples: string[] = []
    for (const url of [src.url, ...(src.extraUrls ?? [])]) {
      const res = await politeGet(url, { retries: 1 })
      status = Math.max(status, res.status)
      if (res.status >= 400) continue
      const { items } = parseListing(src, res.body.toString("utf8"), res.url)
      listed += items.length
      for (const it of items) {
        if (!triageNotice(it.title, it.description).relevant) continue
        relevant++
        if (samples.length < 3) samples.push(it.title.slice(0, 90))
      }
    }
    return { ...base, ok: relevant > 0, status, listed, relevant, samples }
  } catch (e) {
    const cause = (e as { cause?: { code?: string; message?: string } }).cause
    const msg = e instanceof Error ? e.message : String(e)
    return { ...base, ok: false, error: cause ? `${msg} (${cause.code ?? cause.message})` : msg }
  }
}

function loadAll(file?: string): SourceDef[] {
  if (file) return JSON.parse(readFileSync(path.resolve(file), "utf8")) as SourceDef[]
  const dir = path.join(HERE, "sources")
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .flatMap((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as SourceDef[])
}

async function main() {
  const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split("=").slice(1).join("=")
  const tier = arg("tier")?.toUpperCase()
  const only = arg("source")
  const verbose = process.argv.includes("--verbose")
  const sources = loadAll(arg("file")).filter((s) => (!tier || s.level === tier) && (!only || s.id === only))
  console.log(`Checking ${sources.length} source(s)…`)
  const limit = pLimit(Number(process.env.INGEST_HOST_CONCURRENCY || 8))
  const report = await Promise.all(
    sources.map((s) =>
      limit(async () => {
        const h = await checkSource(s)
        const line = `${h.ok ? "OK  " : "FAIL"} ${s.id.padEnd(28)} ${String(h.status ?? "-").padStart(3)}  listed ${String(h.listed).padStart(3)}  relevant ${String(h.relevant).padStart(3)}${h.error ? `  ${h.error}` : ""}`
        console.log(line)
        if (verbose) for (const t of h.samples) console.log(`       · ${t}`)
        return h
      }),
    ),
  )
  const bad = report.filter((r) => !r.ok)
  console.log(`\n${report.length - bad.length}/${report.length} sources OK${bad.length ? ` - failing: ${bad.map((b) => b.id).join(", ")}` : ""}`)
  const out = arg("json")
  if (out) writeFileSync(path.resolve(out), `${JSON.stringify(report, null, 2)}\n`)
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
