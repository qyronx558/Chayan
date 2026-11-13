/**
 * Finds the official NIC S3WaaS portal + recruitment notice board of every
 * district in prisma/data/india_districts_statewise.csv and writes
 * scripts/ingest/sources/districts.json (unresolved ones → districts-unresolved.json).
 *
 *   npx tsx scripts/ingest/discover-districts.ts                 # all states
 *   npx tsx scripts/ingest/discover-districts.ts --state=Bihar   # one state (merged into the file)
 *
 * Safe to re-run: verified entries are kept, new ones merged in. Review the
 * diff before committing - only committed sources are crawled.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import * as cheerio from "cheerio"
import pLimit from "p-limit"
import type { SourceDef } from "../../src/lib/ingest/types"
import { politeGet } from "./http"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, "../..")
const CSV = path.join(ROOT, "prisma/data/india_districts_statewise.csv")
const OUT = path.join(HERE, "sources/districts.json")
const UNRESOLVED = path.join(HERE, "districts-unresolved.json")
const OVERRIDES: Record<string, string> = JSON.parse(readFileSync(path.join(HERE, "district-hosts.json"), "utf8"))

const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-")

export function hostCandidates(district: string): string[] {
  const base = district.toLowerCase().normalize("NFKD").replace(/\(.*?\)/g, "").replace(/[^a-z0-9 ]/g, "").trim()
  const joined = base.replace(/\s+/g, "")
  const hyphen = base.replace(/\s+/g, "-")
  const first = base.split(/\s+/)[0]
  const names = [...new Set([joined, hyphen, first, `${joined}district`])].filter((n) => n.length >= 3)
  return names.flatMap((n) => [`${n}.nic.in`, `${n}.gov.in`])
}

interface Row {
  state: string
  district: string
}

function readCsv(): Row[] {
  const lines = readFileSync(CSV, "utf8").split(/\r?\n/).slice(1).filter(Boolean)
  return lines.map((l) => {
    const cells = l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim())
    return { state: cells[0], district: cells[2] }
  })
}

async function probe(row: Row): Promise<SourceDef | null> {
  const override = OVERRIDES[`${row.state}/${row.district}`]
  const want = override ? "" : row.district.toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g, "")
  for (const host of override ? [override] : hostCandidates(row.district)) {
    try {
      const home = await politeGet(`https://${host}/`, { retries: 0 })
      if (home.status >= 400) continue
      const html = home.body.toString("utf8")
      if (!/s3waas/i.test(html)) continue
      const $ = cheerio.load(html)
      const title = $("title").text().toLowerCase()
      const hostState = $("body").text().toLowerCase()
      if (want && !title.includes(want) && !host.startsWith(want)) continue
      if (!hostState.includes(row.state.toLowerCase().split(" ")[0])) continue
      const origin = new URL(home.url).origin
      const prefix = new URL(home.url).pathname.replace(/\/+$/, "") // e.g. "/en" on bilingual sites
      const cats = new Set<string>()
      $('a[href*="notice_category/"]').each((_, a) => {
        const href = $(a).attr("href") ?? ""
        const m = href.match(/notice_category\/([^/?#]+)/)
        if (m) cats.add(m[1].toLowerCase())
      })
      const recruit = [...cats].find((c) => /recruit/.test(c))
      const result = [...cats].find((c) => /result/.test(c))
      const recruitUrl = recruit
        ? `${origin}${prefix}/notice_category/${recruit}/`
        : await (async () => {
            for (const c of ["recruitment", "recruitments"]) {
              const u = `${origin}${prefix}/notice_category/${c}/`
              const r = await politeGet(u, { retries: 0 }).catch(() => null)
              if (r && r.status === 200) return u
            }
            return null
          })()
      if (!recruitUrl) continue
      return {
        id: `nic:${slug(row.state)}/${slug(row.district)}`,
        name: `District ${row.district}, ${row.state}`,
        level: "DISTRICT",
        adapter: "nic-s3waas",
        url: recruitUrl,
        ...(result ? { extraUrls: [`${origin}${prefix}/notice_category/${result}/`] } : {}),
        state: row.state,
        district: row.district,
        department: `District Administration ${row.district}`,
        allowHosts: ["s3waas.gov.in"],
        schedule: "daily",
      }
    } catch {
      // try next candidate
    }
  }
  return null
}

async function main() {
  const onlyState = process.argv.find((a) => a.startsWith("--state="))?.slice(8)
  const rows = readCsv().filter((r) => !onlyState || r.state.toLowerCase() === onlyState.toLowerCase())
  const existing: SourceDef[] = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : []
  const byId = new Map(existing.map((s) => [s.id, s]))
  const limit = pLimit(12)
  const unresolved: Row[] = []
  let done = 0
  await Promise.all(
    rows.map((row) =>
      limit(async () => {
        const id = `nic:${slug(row.state)}/${slug(row.district)}`
        if (byId.has(id)) return
        const src = await probe(row)
        if (src) byId.set(src.id, src)
        else unresolved.push(row)
        if (++done % 25 === 0) console.log(`  ${done}/${rows.length} probed`)
      }),
    ),
  )
  const sorted = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))
  writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`)
  writeFileSync(UNRESOLVED, `${JSON.stringify(unresolved, null, 2)}\n`)
  console.log(`Districts with a recruitment board: ${sorted.length}. Unresolved this run: ${unresolved.length} (see ${path.relative(ROOT, UNRESOLVED)})`)
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
