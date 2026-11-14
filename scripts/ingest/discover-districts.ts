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
import "./env" // must stay first: loads .env before other modules read process.env
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

/**
 * State portals that host district sites under their own domain
 * (e.g. barpeta.assam.gov.in, ajmer.rajasthan.gov.in). Tried after nic.in / gov.in.
 */
const STATE_SUFFIXES: Record<string, string[]> = {
  "Andaman and Nicobar Islands": ["andaman.gov.in"],
  "Andhra Pradesh": ["ap.gov.in"],
  "Arunachal Pradesh": ["arunachal.gov.in"],
  Assam: ["assam.gov.in"],
  Bihar: ["bih.nic.in"],
  Chhattisgarh: ["cg.gov.in"],
  "Dadra and Nagar Haveli and Daman and Diu": ["ddd.gov.in"],
  Delhi: ["delhi.gov.in"],
  Gujarat: ["gujarat.gov.in"],
  Haryana: ["haryana.gov.in"],
  "Himachal Pradesh": ["hp.gov.in", "hp.nic.in"],
  "Jammu and Kashmir": ["jk.gov.in"],
  Karnataka: ["karnataka.gov.in"],
  Kerala: ["kerala.gov.in"],
  Ladakh: ["ladakh.gov.in"],
  "Madhya Pradesh": ["mp.gov.in"],
  Maharashtra: ["maharashtra.gov.in"],
  Meghalaya: ["meghalaya.gov.in"],
  Mizoram: ["mizoram.gov.in"],
  Nagaland: ["nagaland.gov.in"],
  Odisha: ["odisha.gov.in"],
  Puducherry: ["py.gov.in"],
  Punjab: ["punjab.gov.in"],
  Rajasthan: ["rajasthan.gov.in"],
  Sikkim: ["sikkim.gov.in"],
  Telangana: ["telangana.gov.in", "telangana.nic.in"],
  "Uttar Pradesh": ["up.gov.in", "up.nic.in"],
  "West Bengal": ["wb.gov.in"],
}

/** Older / short names that district portals still use. Key: CSV district name. */
const DISTRICT_ALIASES: Record<string, string[]> = {
  Ahilyanagar: ["ahmednagar"],
  Dharashiv: ["osmanabad"],
  "Chhatrapati Sambhajinagar": ["aurangabad"],
  "Gautam Buddha Nagar": ["noida", "gbnagar"],
  "Lakhimpur Kheri": ["kheri"],
  "Sant Kabir Nagar": ["sknagar"],
  "Sahibzada Ajit Singh Nagar": ["sasnagar", "mohali"],
  "Shaheed Bhagat Singh Nagar": ["nawanshahr", "sbsnagar"],
  "Sri Muktsar Sahib": ["muktsar"],
  "Kamrup Metropolitan": ["kamrupmetro"],
  "Dakshin Dinajpur": ["ddinajpur"],
  "South 24 Parganas": ["s24pgs"],
  "North 24 Parganas": ["n24pgs"],
  "Cooch Behar": ["coochbehar"],
  Balasore: ["baleswar"],
  Balangir: ["bolangir"],
  Kendujhar: ["keonjhar"],
  Deogarh: ["debagarh"],
  Subarnapur: ["sonepur"],
  Khordha: ["khurda"],
  Kabirdham: ["kawardha"],
  Korea: ["koriya"],
  "YSR Kadapa": ["kadapa"],
  "Sri Potti Sriramulu Nellore": ["nellore", "spsnellore"],
  "Dr. B.R. Ambedkar Konaseema": ["konaseema"],
  "Alluri Sitharama Raju": ["asr", "allurisitharamaraju"],
  "Parvathipuram Manyam": ["manyam", "parvathipurammanyam"],
  "Bhadradri Kothagudem": ["bhadradri", "kothagudem"],
  "Jayashankar Bhupalpally": ["bhupalpally"],
  "Jogulamba Gadwal": ["gadwal", "jogulamba"],
  "Kumuram Bheem Asifabad": ["asifabad", "komarambheem"],
  "Medchal-Malkajgiri": ["medchal"],
  "Bengaluru Rural": ["bangalorerural"],
  Chamarajanagar: ["chamrajnagar"],
  Belagavi: ["belgaum"],
  "Dakshina Kannada": ["dk"],
  Tumakuru: ["tumkur"],
  "East Singhbhum": ["jamshedpur"],
  "West Singhbhum": ["chaibasa"],
  Sahebganj: ["sahibganj"],
  "Udham Singh Nagar": ["usnagar"],
  "Dadra and Nagar Haveli": ["dnh"],
  "North and Middle Andaman": ["northmiddleandaman"],
  "Eastern West Khasi Hills": ["ewkh"],
  Gurugram: ["gurgaon"],
  Thiruvananthapuram: ["trivandrum"],
  Kasaragod: ["kasargod"],
  Siaha: ["saiha"],
  "Lahaul and Spiti": ["lahaul-spiti"],
  Dang: ["dangs"],
  Kutch: ["kachchh"],
  Mehsana: ["mahesana"],
  "Gaurela-Pendra-Marwahi": ["gpm"],
  "Janjgir-Champa": ["janjgir"],
  "South Salmara-Mankachar": ["ssm"],
  // Delhi's district sites are dm<area>.delhi.gov.in style - the area word alone.
  "Central Delhi": ["central", "dmcentral"],
  "East Delhi": ["east", "dmeast"],
  "New Delhi": ["newdelhi", "dmnewdelhi"],
  "North Delhi": ["north", "dmnorth"],
  "North East Delhi": ["northeast", "dmnortheast"],
  "North West Delhi": ["northwest", "dmnorthwest"],
  "South Delhi": ["south", "dmsouth"],
  "South East Delhi": ["southeast", "dmsoutheast"],
  "South West Delhi": ["southwest", "dmsouthwest"],
  "West Delhi": ["west", "dmwest"],
}

/** States whose district hosts carry a state prefix (hpkangra.nic.in). */
const STATE_HOST_PREFIX: Record<string, string> = { "Himachal Pradesh": "hp" }

/** Notice-category slugs that mean "recruitment" (S3WaaS sites may use Hindi slugs). */
const RECRUIT_CATEGORY = /recruit|भर्ती|भरती|नियुक्ति|ভর্তি|নিয়োগ/
const RESULT_CATEGORY = /result|परिणाम/

/** Hindi-medium portals often never print the English state name. */
const STATE_LOCAL_NAMES: Record<string, string[]> = {
  Bihar: ["बिहार"],
  Chhattisgarh: ["छत्तीसगढ़", "छत्तीसगढ"],
  Haryana: ["हरियाणा"],
  "Himachal Pradesh": ["हिमाचल"],
  Jharkhand: ["झारखंड", "झारखण्ड"],
  "Madhya Pradesh": ["मध्य प्रदेश", "मध्यप्रदेश"],
  Rajasthan: ["राजस्थान"],
  "Uttar Pradesh": ["उत्तर प्रदेश"],
  Uttarakhand: ["उत्तराखंड", "उत्तराखण्ड"],
}

/** Does the page text name this state (in English or the local script)? */
export function pageNamesState(text: string, state: string): boolean {
  const t = text.toLowerCase()
  return t.includes(state.toLowerCase().split(" ")[0]) || (STATE_LOCAL_NAMES[state] ?? []).some((n) => text.includes(n))
}

export function hostCandidates(district: string, state?: string): string[] {
  const base = district.toLowerCase().normalize("NFKD").replace(/\(.*?\)/g, "").replace(/[^a-z0-9 -]/g, "").replace(/-/g, " ").trim()
  const joined = base.replace(/\s+/g, "")
  const hyphen = base.replace(/\s+/g, "-")
  const first = base.split(/\s+/)[0]
  const prefixed = state && STATE_HOST_PREFIX[state] ? [`${STATE_HOST_PREFIX[state]}${joined}`] : []
  const names = [...new Set([...(DISTRICT_ALIASES[district] ?? []), joined, hyphen, first, `${joined}district`, ...prefixed])].filter((n) => n.length >= 2)
  const suffixes = ["nic.in", "gov.in", ...(state ? (STATE_SUFFIXES[state] ?? []) : [])]
  // Short first-word guesses ("east", "west") only make sense under a state domain.
  return names.flatMap((n) => suffixes.filter((s) => n.length >= 3 || !/^(nic|gov)\.in$/.test(s)).map((s) => `${n}.${s}`))
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

interface Unresolved extends Row {
  /** Official district site that answered but is not an S3WaaS portal (needs a hand-made html-links source). */
  site?: string
}

async function probe(row: Row): Promise<SourceDef | { site: string } | null> {
  const override = OVERRIDES[`${row.state}/${row.district}`]
  // Words that prove a page belongs to this district (aliases cover renamed districts).
  const want = override
    ? []
    : [row.district.toLowerCase().split(/[\s-]+/)[0].replace(/[^a-z]/g, ""), ...(DISTRICT_ALIASES[row.district] ?? [])].filter((w) => w.length >= 3)
  let otherSite: string | null = null
  for (const host of override ? [override] : hostCandidates(row.district, row.state)) {
    try {
      const home = await politeGet(`https://${host}/`, { retries: 0 })
      if (home.status >= 400) continue
      const html = home.body.toString("utf8")
      const $ = cheerio.load(html)
      const title = $("title").text().toLowerCase()
      const hostState = $("body").text().toLowerCase()
      if (want.length && !want.some((w) => title.includes(w) || host.startsWith(w))) continue
      if (!pageNamesState(hostState, row.state)) continue
      const id = `nic:${slug(row.state)}/${slug(row.district)}`
      if (!/s3waas/i.test(html)) {
        // Assam's district portals (Drupal) keep a /document/recruitment board with PDFs on the same host.
        const docBoard = $('a[href$="/document/recruitment"]').length > 0
        if (docBoard) {
          const origin = new URL(home.url).origin
          const hasAdvts = $('a[href$="/document/advertisements"]').length > 0
          return {
            id,
            name: `District ${row.district}, ${row.state}`,
            level: "DISTRICT",
            adapter: "html-links",
            url: `${origin}/document/recruitment`,
            ...(hasAdvts ? { extraUrls: [`${origin}/document/advertisements`] } : {}),
            include: "[.]pdf",
            state: row.state,
            district: row.district,
            department: `District Administration ${row.district}`,
            schedule: "daily",
          }
        }
        otherSite ??= new URL(home.url).origin
        continue
      }
      const origin = new URL(home.url).origin
      const prefix = new URL(home.url).pathname.replace(/\/+$/, "") // e.g. "/en" on bilingual sites
      const cats = new Set<string>()
      $('a[href*="notice_category/"]').each((_, a) => {
        const href = $(a).attr("href") ?? ""
        const m = href.match(/notice_category\/([^/?#]+)/)
        if (m) cats.add(m[1].toLowerCase())
      })
      const decoded = (c: string) => {
        try {
          return decodeURIComponent(c)
        } catch {
          return c
        }
      }
      const recruit = [...cats].find((c) => RECRUIT_CATEGORY.test(decoded(c)))
      const result = [...cats].find((c) => RESULT_CATEGORY.test(decoded(c)))
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
        id,
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
  return otherSite ? { site: otherSite } : null
}

async function main() {
  const onlyState = process.argv.find((a) => a.startsWith("--state="))?.slice(8)
  const rows = readCsv().filter((r) => !onlyState || r.state.toLowerCase() === onlyState.toLowerCase())
  const existing: SourceDef[] = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : []
  const byId = new Map(existing.map((s) => [s.id, s]))
  const limit = pLimit(12)
  const unresolved: Unresolved[] = []
  let done = 0
  await Promise.all(
    rows.map((row) =>
      limit(async () => {
        const id = `nic:${slug(row.state)}/${slug(row.district)}`
        if (byId.has(id)) return
        const src = await probe(row)
        if (src && "id" in src) byId.set(src.id, src)
        else unresolved.push(src ? { ...row, site: src.site } : row)
        if (++done % 25 === 0) console.log(`  ${done}/${rows.length} probed`)
      }),
    ),
  )
  const sorted = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))
  writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`)
  // The unresolved file always lists every district still missing (a --state run must not drop the others).
  const previous: Unresolved[] = existsSync(UNRESOLVED) ? JSON.parse(readFileSync(UNRESOLVED, "utf8")) : []
  const key = (r: Row) => `${r.state}/${r.district}`
  const site = new Map([...previous, ...unresolved].filter((u) => u.site).map((u) => [key(u), u.site]))
  const missing: Unresolved[] = readCsv()
    .filter((r) => !byId.has(`nic:${slug(r.state)}/${slug(r.district)}`))
    .map((r) => (site.get(key(r)) ? { ...r, site: site.get(key(r)) } : r))
  writeFileSync(UNRESOLVED, `${JSON.stringify(missing, null, 2)}\n`)
  const withSite = missing.filter((u) => u.site).length
  console.log(
    `Districts with a recruitment board: ${sorted.length}. Still missing: ${missing.length} (this run: ${unresolved.length}), of which ${withSite} have a non-S3WaaS site (see ${path.relative(ROOT, UNRESOLVED)})`,
  )
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
