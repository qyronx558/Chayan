import * as cheerio from "cheerio"
import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizeWebsite } from "@/lib/companies"
import { safeCareerUrl } from "@/lib/private-jobs/career-page"
import { feedPublicUrl } from "@/lib/private-jobs/feed-sync"
import type { FetchLike } from "@/lib/private-jobs/feeds"

/**
 * Finds a real logo for a company, the way a person would in a browser:
 *
 *   1. the company's job board page (Lever / Greenhouse show the logo),
 *   2. the company website: apple-touch-icon → schema.org Organization logo →
 *      large icon → header logo image,
 *   3. a public icon service for the domain (Google, DuckDuckGo), then /favicon.ico.
 *
 * Websites come from the company record, the job links (when they are on the
 * company's own domain), or - verified against the page title - from the name.
 * Every candidate is downloaded and must really be an image before it is used.
 */

const UA = "Mozilla/5.0 (compatible; ChayanJobsBot/1.0; +company logo lookup)"
const TIMEOUT_MS = 7000
const MAX_IMAGE_BYTES = 3_000_000
/** Re-check companies without a logo this often (sites add icons, domains change). */
export const LOGO_RECHECK_DAYS = 14

/** Hosts that belong to job platforms, not to the employer. */
const PLATFORM_HOSTS = [
  "greenhouse.io", "lever.co", "ashbyhq.com", "myworkdayjobs.com", "workday.com", "smartrecruiters.com", "workable.com",
  "recruitee.com", "zohorecruit.com", "zohorecruit.in", "darwinbox.in", "keka.com", "freshteam.com", "naukri.com",
  "linkedin.com", "indeed.com", "indeed.co.in", "foundit.in", "monsterindia.com", "shine.com", "timesjobs.com", "instahyre.com",
  "wellfound.com", "angel.co", "cutshort.io", "hirist.tech", "iimjobs.com", "internshala.com", "unstop.com", "sites.google.com",
  "forms.gle", "goo.gl", "bit.ly", "tinyurl.com", "gmail.com", "docs.google.com", "chayanjobs.com", "successfactors.com",
  "successfactors.eu", "oraclecloud.com", "taleo.net", "icims.com", "jobvite.com", "bamboohr.com", "breezy.hr", "teamtailor.com",
]

const isPlatformHost = (host: string) => PLATFORM_HOSTS.some((p) => host === p || host.endsWith(`.${p}`))

/** "careers.acme.co.in" → "acme.co.in" (good enough for company sites). */
export function siteRoot(host: string): string {
  return host.replace(/^(www|careers?|jobs|apply|hiring|talent|work)\./i, "")
}

const LEGAL_WORDS =
  /\b(private|pvt|limited|ltd|llp|inc|incorporated|corp|corporation|company|co|plc|gmbh|technologies|technology|tech|solutions|services|software|systems|india|global|group|labs?|the)\b\.?/gi

/** Domains worth trying for a company that has no website on record. */
export function guessDomains(name: string): string[] {
  const base = name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]/g, " ")
  const core = base.replace(LEGAL_WORDS, " ").replace(/\s+/g, " ").trim()
  const words = (core || base.trim()).split(" ").filter(Boolean)
  if (!words.length) return []
  const full = base.replace(/\b(private|pvt|limited|ltd|llp|inc|incorporated|corp|corporation|plc|gmbh|the)\b\.?/g, " ").split(/\s+/).filter(Boolean)
  const stems = new Set<string>([words.join("")])
  if (full.length >= 2) stems.add(full.map((w) => w[0]).join(""))
  stems.add(words[0])
  const out: string[] = []
  for (const stem of stems) {
    if (stem.length < 2) continue
    for (const tld of [".com", ".in", ".co.in", ".io", ".ai", ".co"]) out.push(`${stem}${tld}`)
  }
  return out.slice(0, 18)
}

/** Lower-case words a page must mention to count as the company's site. */
function nameTokens(name: string): string[] {
  const core = name.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(LEGAL_WORDS, " ")
  const words = core.split(/\s+/).filter((w) => w.length >= 3)
  return words.length ? words : name.toLowerCase().split(/\s+/).filter(Boolean)
}

async function fetchWithTimeout(url: string, init: RequestInit, fetchImpl: FetchLike): Promise<Response | null> {
  if (!safeCareerUrl(url)) return null
  try {
    return await fetchImpl(url, { ...init, redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch {
    return null
  }
}

interface Page {
  url: string
  html: string
}

async function fetchPage(url: string, fetchImpl: FetchLike): Promise<Page | null> {
  const res = await fetchWithTimeout(url, { headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*;q=0.8" } }, fetchImpl)
  // 200 only: 202/203 are usually bot-challenge pages.
  if (!res || res.status !== 200) return null
  if (!(res.headers.get("content-type") || "text/html").includes("html")) return null
  const html = (await res.text()).slice(0, 1_500_000)
  // The final URL after redirects is the base for relative icon links.
  const finalUrl = res.url && /^https?:/.test(res.url) ? res.url : url
  if (!safeCareerUrl(finalUrl)) return null
  return { url: finalUrl, html }
}

const abs = (href: string | undefined, base: string): string | null => {
  if (!href || href.startsWith("data:")) return null
  try {
    const u = new URL(href.trim(), base)
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null
  } catch {
    return null
  }
}

const largest = (sizes: string | undefined) =>
  Math.max(0, ...(sizes || "").split(/\s+/).map((s) => parseInt(s.split("x")[0], 10)).filter(Number.isFinite))

/** Logo candidates on one page: `best` are real logos / large icons, `weak` are small favicons. */
export function logoCandidatesFromHtml(
  html: string,
  pageUrl: string,
  opts: { boardPage?: boolean; companyName?: string } = {}
): { best: string[]; named: string[]; weak: string[] } {
  const $ = cheerio.load(html)
  const best: string[] = []
  const named: string[] = []
  const weak: string[] = []
  const push = (list: string[], href: string | undefined) => {
    const u = abs(href, pageUrl)
    if (u && !best.includes(u) && !named.includes(u) && !weak.includes(u)) list.push(u)
  }
  const tokens = opts.companyName ? nameTokens(opts.companyName) : []
  const logoImgs = (strict: boolean) =>
    $("img")
      .filter((_, el) => {
        const $el = $(el)
        const attrs = `${$el.attr("class") || ""} ${$el.attr("id") || ""} ${$el.attr("alt") || ""} ${$el.attr("src") || ""}`.toLowerCase()
        if (!/logo/.test(attrs)) return false
        if (!strict) return true
        // On a company homepage only an image that names the company counts - not product,
        // partner or cookie-banner logos.
        if ($el.closest("[id*=onetrust], [class*=cookie], [id*=cookie], [class*=consent], footer").length) return false
        const label = [$el.attr("alt"), $el.attr("class"), $el.attr("id"), $el.attr("title")].filter(Boolean).join(" ").toLowerCase()
        return tokens.some((t) => label.includes(t))
      })
      .map((_, el) => $(el).attr("src") || $(el).attr("data-src"))
      .get()

  // Job board pages: the header logo is the company's own.
  if (opts.boardPage) logoImgs(false).slice(0, 2).forEach((h) => push(best, h))

  // Square app icons look best at avatar size.
  $('link[rel~="apple-touch-icon"], link[rel~="apple-touch-icon-precomposed"]')
    .toArray()
    .sort((a, b) => largest($(b).attr("sizes")) - largest($(a).attr("sizes")))
    .forEach((el) => push(best, $(el).attr("href")))

  // schema.org Organization logo.
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const walk = (v: unknown): void => {
        if (!v || typeof v !== "object") return
        if (Array.isArray(v)) return v.forEach(walk)
        const o = v as Record<string, unknown>
        const type = String(o["@type"] ?? "")
        if (o.logo && /organization|corporation|brand|website|localbusiness/i.test(type)) {
          const logo = o.logo
          push(best, typeof logo === "string" ? logo : ((logo as Record<string, unknown>).url as string | undefined))
        }
        if (o["@graph"]) walk(o["@graph"])
        if (o.publisher) walk(o.publisher)
      }
      walk(JSON.parse($(el).contents().text()))
    } catch {
      // ignore broken JSON-LD
    }
  })

  // Big or vector icons.
  $('link[rel~="icon"], link[rel="shortcut icon"]')
    .toArray()
    .filter((el) => largest($(el).attr("sizes")) >= 96 || /svg/i.test(`${$(el).attr("type") || ""} ${$(el).attr("href") || ""}`))
    .sort((a, b) => largest($(b).attr("sizes")) - largest($(a).attr("sizes")))
    .forEach((el) => push(best, $(el).attr("href")))
  push(best, $('meta[itemprop="logo"]').attr("content"))
  push(best, $('meta[name="msapplication-TileImage"]').attr("content"))
  if (!opts.boardPage) logoImgs(true).slice(0, 1).forEach((h) => push(named, h))

  // Small favicons: only when nothing better exists.
  $('link[rel~="icon"], link[rel="shortcut icon"]').each((_, el) => push(weak, $(el).attr("href")))
  return { best, named, weak }
}

/* ───────────── Wikidata: official website + logo of well-known companies ───────────── */

const COMPANYISH =
  /compan|corporat|business|enterprise|firm|conglomerate|startup|multinational|bank|platform|provider|developer|manufactur|service|software|technolog|e-commerce|ecommerce|fintech|retail|subsidiary|brand|consult|outsourc|airline|insurer|group|\bapp\b|delivery|online|marketplace|website|portal|payment|unicorn|aggregator/i

const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(LEGAL_WORDS, " ").replace(/[^a-z0-9]/g, "")

/**
 * Wikimedia asks API clients to identify themselves and not burst: calls go out
 * one at a time with a short gap, and a 429 pauses lookups for a minute.
 * Set BOT_CONTACT (a URL or e-mail) to add contact details to the user agent.
 */
const WIKI_UA = `ChayanJobsBot/1.0 (${process.env.BOT_CONTACT?.trim() || "company logo lookup"})`
let wikiQueue: Promise<unknown> = Promise.resolve()
let wikiPausedUntil = 0

function wikidataFetch(url: string, fetchImpl: FetchLike): Promise<Response | null> {
  const run = async (): Promise<Response | null> => {
    if (Date.now() < wikiPausedUntil) return null
    const res = await fetchWithTimeout(url, { headers: { "User-Agent": WIKI_UA, Accept: "application/json" } }, fetchImpl)
    if (res?.status === 429) {
      wikiPausedUntil = Date.now() + 60_000
      return null
    }
    await new Promise((r) => setTimeout(r, 250))
    return res
  }
  const next = wikiQueue.then(run, run)
  wikiQueue = next.catch(() => null)
  return next
}

export interface WikidataCompany {
  website: string | null
  logo: string | null
}

/** Looks the company up on Wikidata (exact name match + business description). */
export async function wikidataCompany(name: string, fetchImpl: FetchLike): Promise<WikidataCompany | null> {
  const api = "https://www.wikidata.org/w/api.php"
  const search = await wikidataFetch(
    `${api}?action=wbsearchentities&format=json&language=en&type=item&limit=7&search=${encodeURIComponent(name)}`,
    fetchImpl
  )
  if (!search?.ok) return null
  const hits = ((await search.json().catch(() => null)) as { search?: { id: string; label?: string; description?: string; aliases?: string[]; match?: { text?: string } }[] } | null)?.search ?? []
  const want = compact(name)
  const ids = hits
    .filter((h) => {
      const names = [h.label, h.match?.text, ...(h.aliases ?? [])].filter((v): v is string => !!v)
      const same = names.some((n) => compact(n) === want || n.toLowerCase() === name.toLowerCase())
      return same && COMPANYISH.test(h.description || "")
    })
    .slice(0, 3)
    .map((h) => h.id)
  if (!ids.length) return null
  const ent = await wikidataFetch(`${api}?action=wbgetentities&format=json&props=claims&ids=${ids.join("|")}`, fetchImpl)
  if (!ent?.ok) return null
  type Claim = { mainsnak?: { datavalue?: { value?: unknown } }; rank?: string }
  const entities = ((await ent.json().catch(() => null)) as { entities?: Record<string, { claims?: Record<string, Claim[]> }> } | null)?.entities ?? {}
  const first = (claims: Claim[] | undefined) => {
    const list = (claims ?? []).filter((c) => c.rank !== "deprecated")
    const pick = list.find((c) => c.rank === "preferred") ?? list[0]
    const v = pick?.mainsnak?.datavalue?.value
    return typeof v === "string" ? v : null
  }
  for (const id of ids) {
    const claims = entities[id]?.claims
    if (!claims) continue
    const website = first(claims.P856)
    const file = first(claims.P154)
    if (!website && !file) continue
    return {
      website: website && safeCareerUrl(website) ? website : null,
      logo: file ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, "_"))}?width=256` : null,
    }
  }
  return null
}

/** Whether the page belongs to the company (used only for guessed domains). */
export function pageMatchesCompany(html: string, name: string): boolean {
  const $ = cheerio.load(html)
  const text = [
    $("title").first().text(),
    $('meta[property="og:site_name"]').attr("content"),
    $('meta[property="og:title"]').attr("content"),
    $('meta[name="application-name"]').attr("content"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  if (!text) return false
  const tokens = nameTokens(name)
  return tokens.length > 0 && tokens.some((t) => text.includes(t))
}

/** Downloads the candidate and checks it really is a usable image. */
export async function isUsableImage(url: string, fetchImpl: FetchLike): Promise<boolean> {
  const host = (() => {
    try {
      return new URL(url).hostname
    } catch {
      return ""
    }
  })()
  const ua = /(^|\.)(wikimedia|wikipedia)\.org$/.test(host) ? WIKI_UA : UA
  const res = await fetchWithTimeout(url, { headers: { "User-Agent": ua, Accept: "image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8" } }, fetchImpl)
  if (!res || !res.ok) return false
  const type = (res.headers.get("content-type") || "").toLowerCase()
  const looksImage = type.startsWith("image/") || /\.(png|jpe?g|webp|svg|ico|gif|avif)(\?|$)/i.test(url)
  if (!looksImage || type.includes("html")) return false
  const buf = await res.arrayBuffer().catch(() => null)
  return !!buf && buf.byteLength >= 100 && buf.byteLength <= MAX_IMAGE_BYTES
}

export interface LogoInput {
  name: string
  website?: string | null
  /** Job board pages of the company (Lever / Greenhouse / Ashby). */
  boardUrls?: string[]
  /** Application / proof links of its jobs. */
  jobUrls?: string[]
}

export interface LogoResult {
  logo: string
  source: "board" | "website" | "wikidata" | "icon-service" | "favicon"
  /** The company site the logo came from, when we found it (fills an empty website). */
  website: string | null
}

const iconServices = (host: string) => [
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
  `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`,
]

export async function resolveCompanyLogo(input: LogoInput, opts: { fetchImpl?: FetchLike; deadline?: number } = {}): Promise<LogoResult | null> {
  const fetchImpl = opts.fetchImpl ?? (fetch as FetchLike)
  const deadline = opts.deadline ?? Date.now() + 25_000
  const timeLeft = () => Date.now() < deadline

  const firstUsable = async (candidates: string[], max = 4) => {
    for (const c of candidates.slice(0, max)) {
      if (!timeLeft()) return null
      if (await isUsableImage(c, fetchImpl)) return c
    }
    return null
  }

  // 1. Job board pages.
  for (const board of (input.boardUrls ?? []).filter(Boolean)) {
    if (!timeLeft()) break
    const page = await fetchPage(board, fetchImpl)
    if (!page) continue
    const hit = await firstUsable(logoCandidatesFromHtml(page.html, page.url, { boardPage: true }).best, 2)
    if (hit) return { logo: hit, source: "board", website: null }
  }

  const tried = new Set<string>()
  /** Reads one company site; `blocked` when the page could not be fetched (bot protection, down). */
  const fromSite = async (host: string, verify: boolean): Promise<LogoResult | "blocked" | "mismatch" | null> => {
    tried.add(host)
    const page = (await fetchPage(`https://${host}/`, fetchImpl)) ?? (await fetchPage(`https://www.${host}/`, fetchImpl))
    if (!page) return "blocked"
    if (verify && !pageMatchesCompany(page.html, input.name)) return "mismatch"
    const website = verify ? normalizeWebsite(page.url) : null
    const pageHost = new URL(page.url).hostname
    const { best, named, weak } = logoCandidatesFromHtml(page.html, page.url, { companyName: input.name })
    const good = await firstUsable(best, 4)
    if (good) return { logo: good, source: "website", website }
    const svc = await firstUsable(iconServices(pageHost).slice(0, 1), 1)
    if (svc) return { logo: svc, source: "icon-service", website }
    const small = await firstUsable([...named, ...weak, new URL("/favicon.ico", page.url).toString(), ...iconServices(pageHost).slice(1)], 3)
    if (small) return { logo: small, source: "favicon", website }
    return null
  }

  // 2. The website on record is trusted; job-link domains only count when their page names the company
  //    (apply links are sometimes third-party or wrong).
  const trusted: string[] = []
  const linked: string[] = []
  const addHost = (raw: string | null | undefined, list: string[]) => {
    if (!raw) return
    try {
      const host = siteRoot(new URL(/^https?:/i.test(raw) ? raw : `https://${raw}`).hostname.toLowerCase())
      if (host && !isPlatformHost(host) && !list.includes(host)) list.push(host)
    } catch {
      // not a URL
    }
  }
  addHost(input.website, trusted)
  for (const u of input.jobUrls ?? []) addHost(u, linked)
  const blocked: string[] = []
  for (const host of trusted) {
    if (!timeLeft()) break
    const r = await fromSite(host, false)
    if (r && typeof r === "object") return r
    if (r === "blocked") blocked.push(host)
  }
  for (const host of linked.filter((h) => !tried.has(h)).slice(0, 2)) {
    if (!timeLeft()) break
    const r = await fromSite(host, true)
    // A careers domain (e.g. amazon.jobs) is not the company website.
    if (r && typeof r === "object") return { ...r, website: null }
  }

  // 3. Wikidata: official website and logo of well-known companies.
  const wd = timeLeft() ? await wikidataCompany(input.name, fetchImpl).catch(() => null) : null
  const wdHost = (() => {
    const list: string[] = []
    addHost(wd?.website, list)
    return list[0] ?? null
  })()
  const wdSite = wd?.website ? normalizeWebsite(wd.website) : null
  if (wdHost && !tried.has(wdHost) && timeLeft()) {
    const r = await fromSite(wdHost, false)
    if (r && typeof r === "object") return { ...r, source: r.source === "website" ? "website" : r.source, website: wdSite }
    if (r === "blocked") blocked.push(wdHost)
  }
  if (wd?.logo && timeLeft() && (await isUsableImage(wd.logo, fetchImpl))) return { logo: wd.logo, source: "wikidata", website: wdSite }

  // 4. Domains guessed from the name - used only when the page names the company.
  if (!trusted.length && !wdHost) {
    for (const host of guessDomains(input.name)) {
      if (!timeLeft() || tried.has(host)) continue
      const r = await fromSite(host, true)
      if (r && typeof r === "object") return r
      if (r === null) break // right site, nothing usable on it
    }
  }

  // 5. A known domain whose page could not be read: the icon services still have its icon.
  for (const host of blocked) {
    if (!timeLeft()) break
    const svc = await firstUsable(iconServices(host), 2)
    if (svc) return { logo: svc, source: "icon-service", website: host === wdHost ? wdSite : null }
  }
  return null
}

/** Company fields + hints the resolver needs, loaded in two queries. */
async function loadHints(companyIds: string[]) {
  const [feeds, jobs] = await Promise.all([
    prisma.privateJobFeed.findMany({ where: { companyId: { in: companyIds } }, select: { companyId: true, provider: true, boardToken: true, pageUrl: true } }),
    prisma.privateJob.findMany({
      where: { companyId: { in: companyIds } },
      select: { companyId: true, applicationUrl: true, proofUrl: true },
      orderBy: { createdAt: "desc" },
      take: companyIds.length * 5,
    }),
  ])
  const boards = new Map<string, string[]>()
  for (const f of feeds) {
    // Ashby boards render with JavaScript - no logo in the HTML.
    if (f.provider === "ASHBY") continue
    const url = f.provider === "GREENHOUSE" ? `https://job-boards.greenhouse.io/${f.boardToken}` : feedPublicUrl(f)
    boards.set(f.companyId, [...(boards.get(f.companyId) ?? []), url])
  }
  const links = new Map<string, string[]>()
  for (const j of jobs) {
    const list = links.get(j.companyId) ?? []
    for (const u of [j.applicationUrl, j.proofUrl]) if (u && list.length < 6) list.push(u)
    links.set(j.companyId, list)
  }
  return { boards, links }
}

export interface LogoFillResult {
  checked: number
  found: number
  results: { companyId: string; name: string; logo: string | null; source: string | null }[]
}

/**
 * Fills missing logos: companies with live private jobs first, each company at
 * most once per LOGO_RECHECK_DAYS (unless `force`), within a time budget.
 */
export async function fillMissingLogos(opts: {
  limit?: number
  budgetMs?: number
  companyIds?: string[]
  force?: boolean
  fetchImpl?: FetchLike
} = {}): Promise<LogoFillResult> {
  const started = Date.now()
  const budget = opts.budgetMs ?? 40_000
  const recheckBefore = new Date(Date.now() - LOGO_RECHECK_DAYS * 86_400_000)
  const companies = await prisma.company.findMany({
    where: {
      AND: [
        { OR: [{ logo: null }, { logo: "" }] },
        opts.companyIds ? { id: { in: opts.companyIds } } : { privateJob: { some: { status: "ACTIVE" } } },
        ...(opts.force ? [] : [{ OR: [{ logoCheckedAt: null }, { logoCheckedAt: { lt: recheckBefore } }] }]),
      ],
    },
    select: { id: true, name: true, website: true },
    orderBy: [{ logoCheckedAt: { sort: "asc", nulls: "first" } }, { name: "asc" }],
    take: opts.limit ?? 15,
  })
  const result: LogoFillResult = { checked: 0, found: 0, results: [] }
  if (!companies.length) return result
  const { boards, links } = await loadHints(companies.map((c) => c.id))

  // A few at a time: each lookup mostly waits on the network.
  const queue = [...companies]
  const worker = async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      const left = budget - (Date.now() - started)
      if (left < 4000) return
      let hit: LogoResult | null = null
      try {
        hit = await resolveCompanyLogo(
          { name: c.name, website: c.website, boardUrls: boards.get(c.id), jobUrls: links.get(c.id) },
          { fetchImpl: opts.fetchImpl, deadline: Date.now() + Math.min(25_000, left - 2000) }
        )
      } catch {
        hit = null
      }
      await prisma.company.update({
        where: { id: c.id },
        data: {
          logoCheckedAt: new Date(),
          ...(hit ? { logo: hit.logo } : {}),
          ...(hit?.website && !c.website ? { website: hit.website } : {}),
        },
      })
      result.checked++
      if (hit) result.found++
      result.results.push({ companyId: c.id, name: c.name, logo: hit?.logo ?? null, source: hit?.source ?? null })
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  return result
}

/** Best-effort lookup for one company right after it is created or gets new jobs. */
export async function ensureCompanyLogo(companyId: string): Promise<void> {
  try {
    await fillMissingLogos({ companyIds: [companyId], limit: 1, budgetMs: 25_000 })
  } catch {
    // never let a logo lookup break the caller
  }
}

/**
 * Runs the lookup after the response is sent (route handlers). Outside a
 * request (scripts, tests) it is skipped - the cron fills those companies.
 */
export function scheduleLogoLookup(companyIds: string[]): void {
  const ids = [...new Set(companyIds.filter(Boolean))]
  if (!ids.length) return
  try {
    after(() => fillMissingLogos({ companyIds: ids, limit: ids.length, budgetMs: 50_000 }).then(() => undefined, () => undefined))
  } catch {
    // no request scope
  }
}
