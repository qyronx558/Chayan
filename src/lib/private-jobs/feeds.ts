import * as cheerio from "cheerio"
import { htmlToText } from "@/lib/private-jobs/html-text"

/**
 * Adapters for companies' official public job-board APIs. These endpoints are
 * published by the ATS vendors for exactly this use (embedding a company's
 * openings elsewhere), return structured JSON and need no scraping or LLM.
 */

/** Providers with a public JSON job-board API (CAREER_PAGE is handled in career-page.ts). */
export type FeedProvider = "GREENHOUSE" | "LEVER" | "ASHBY" | "SMARTRECRUITERS" | "WORKABLE" | "RECRUITEE" | "PERSONIO" | "BREEZY"
export const ATS_PROVIDERS: FeedProvider[] = ["GREENHOUSE", "LEVER", "ASHBY", "SMARTRECRUITERS", "WORKABLE", "RECRUITEE", "PERSONIO", "BREEZY"]

/** One posting as the source reports it, before normalisation. */
export interface FeedPosting {
  externalId: string
  title: string
  location: string | null
  /** Extra location strings (multi-city postings). */
  locations: string[]
  descriptionText: string
  applyUrl: string
  department: string | null
  /** Employment commitment text ("Full-time", "Intern", ...). */
  commitment: string | null
  /** "remote" | "hybrid" | "on-site" when the source says so. */
  workplaceType: string | null
  salary: { min?: number | null; max?: number | null; currency?: string | null; interval?: string | null } | null
  postedAt: Date | null
  /** LLM-extracted postings only: model confidence 0-1 (absent = structured source). */
  confidence?: number
  /** Structured country from the board (ISO code or name), when it gives one. */
  country?: string | null
  /** Structured city from the board. */
  city?: string | null
  /** Seniority / experience label from the board ("Mid-Senior Level", "3-5 years"). */
  experienceHint?: string | null
}

export class FeedError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = "FeedError"
  }
}

const TOKEN_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/

export function isValidBoardToken(token: string): boolean {
  return TOKEN_RE.test(token)
}

/** Accepts a bare token or a board URL and returns the token. */
export function boardTokenFrom(provider: FeedProvider, input: string): string | null {
  const raw = input.trim()
  if (isValidBoardToken(raw)) return raw
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`)
    const seg = u.pathname.split("/").filter(Boolean)
    if (provider === "GREENHOUSE") {
      // boards.greenhouse.io/<token>, job-boards.greenhouse.io/<token>, boards-api.greenhouse.io/v1/boards/<token>
      const i = seg.indexOf("boards")
      const token = i >= 0 ? seg[i + 1] : seg[0]
      if (/greenhouse\.io$/.test(u.hostname) && token && isValidBoardToken(token)) return token
      const q = u.searchParams.get("for")
      if (q && isValidBoardToken(q)) return q
    } else if (provider === "ASHBY") {
      // jobs.ashbyhq.com/<org>, api.ashbyhq.com/posting-api/job-board/<org>
      const i = seg.indexOf("job-board")
      const token = i >= 0 ? seg[i + 1] : seg[0]
      if (/ashbyhq\.com$/.test(u.hostname) && token && isValidBoardToken(token)) return token
    } else if (provider === "SMARTRECRUITERS") {
      // careers.smartrecruiters.com/<Company>, jobs.smartrecruiters.com/<Company>/..., api.smartrecruiters.com/v1/companies/<Company>
      const i = seg.indexOf("companies")
      const token = i >= 0 ? seg[i + 1] : seg[0]
      if (/smartrecruiters\.com$/.test(u.hostname) && token && isValidBoardToken(token)) return token
    } else if (provider === "WORKABLE") {
      // apply.workable.com/<account>, <account>.workable.com
      const sub = u.hostname.match(/^([a-z0-9-]+)\.workable\.com$/i)?.[1]
      const token = sub && sub !== "apply" && sub !== "www" ? sub : seg[0] === "api" ? seg[4] : seg[0]
      if (/workable\.com$/.test(u.hostname) && token && isValidBoardToken(token)) return token
    } else if (provider === "RECRUITEE" || provider === "PERSONIO" || provider === "BREEZY") {
      // <company>.recruitee.com, <company>.jobs.personio.de|com, <company>.breezy.hr
      const host = { RECRUITEE: /^([a-z0-9-]+)\.recruitee\.com$/i, PERSONIO: /^([a-z0-9-]+)\.jobs\.personio\.(?:de|com)$/i, BREEZY: /^([a-z0-9-]+)\.breezy\.hr$/i }[provider]
      const token = u.hostname.match(host)?.[1]
      if (token && isValidBoardToken(token)) return token
    } else if (/lever\.co$/.test(u.hostname)) {
      // jobs.lever.co/<site>, api.lever.co/v0/postings/<site>
      const i = seg.indexOf("postings")
      const token = i >= 0 ? seg[i + 1] : seg[0]
      if (token && isValidBoardToken(token)) return token
    }
  } catch {
    // not a URL
  }
  return null
}

export function feedApiUrl(provider: FeedProvider, token: string): string {
  const t = encodeURIComponent(token)
  switch (provider) {
    case "GREENHOUSE":
      return `https://boards-api.greenhouse.io/v1/boards/${t}/jobs?content=true`
    case "ASHBY":
      return `https://api.ashbyhq.com/posting-api/job-board/${t}?includeCompensation=true`
    case "SMARTRECRUITERS":
      return `https://api.smartrecruiters.com/v1/companies/${t}/postings?limit=100`
    case "WORKABLE":
      return `https://apply.workable.com/api/v1/widget/accounts/${t}?details=true`
    case "RECRUITEE":
      return `https://${t}.recruitee.com/api/offers/`
    case "PERSONIO":
      return `https://${t}.jobs.personio.de/xml?language=en`
    case "BREEZY":
      return `https://${t}.breezy.hr/json`
    default:
      return `https://api.lever.co/v0/postings/${t}?mode=json`
  }
}

export function feedBoardUrl(provider: FeedProvider, token: string): string {
  const t = encodeURIComponent(token)
  switch (provider) {
    case "GREENHOUSE":
      return `https://boards.greenhouse.io/${t}`
    case "ASHBY":
      return `https://jobs.ashbyhq.com/${t}`
    case "SMARTRECRUITERS":
      return `https://careers.smartrecruiters.com/${t}`
    case "WORKABLE":
      return `https://apply.workable.com/${t}`
    case "RECRUITEE":
      return `https://${t}.recruitee.com`
    case "PERSONIO":
      return `https://${t}.jobs.personio.de`
    case "BREEZY":
      return `https://${t}.breezy.hr`
    default:
      return `https://jobs.lever.co/${t}`
  }
}

/* ───────────────────────── Greenhouse ───────────────────────── */

interface GreenhouseJob {
  id: number | string
  title?: string
  absolute_url?: string
  updated_at?: string
  first_published?: string
  location?: { name?: string } | null
  content?: string
  departments?: { name?: string }[]
  offices?: { name?: string; location?: string | null }[]
  metadata?: { name?: string; value?: unknown }[] | null
}

export function mapGreenhouse(payload: unknown): FeedPosting[] {
  const jobs = (payload as { jobs?: GreenhouseJob[] })?.jobs
  if (!Array.isArray(jobs)) throw new FeedError("Unexpected Greenhouse response")
  const out: FeedPosting[] = []
  for (const j of jobs) {
    if (j?.id == null || !j.title || !j.absolute_url) continue
    const offices = (j.offices || []).map((o) => o.location || o.name || "").filter(Boolean)
    const commitment =
      (j.metadata || []).find((m) => /employment|job type|commitment/i.test(m?.name || ""))?.value
    const posted = j.first_published || j.updated_at
    out.push({
      externalId: String(j.id),
      title: j.title.trim(),
      location: j.location?.name?.trim() || offices[0] || null,
      locations: offices,
      // Greenhouse returns the description HTML entity-encoded.
      descriptionText: htmlToText(htmlToText(j.content || "")),
      applyUrl: j.absolute_url,
      department: j.departments?.[0]?.name?.trim() || null,
      commitment: typeof commitment === "string" ? commitment : null,
      workplaceType: null,
      salary: null,
      postedAt: posted ? new Date(posted) : null,
    })
  }
  return out
}

/* ───────────────────────── Lever ───────────────────────── */

interface LeverPosting {
  id?: string
  text?: string
  hostedUrl?: string
  applyUrl?: string
  createdAt?: number
  categories?: { location?: string; team?: string; department?: string; commitment?: string; allLocations?: string[] }
  description?: string
  descriptionPlain?: string
  lists?: { text?: string; content?: string }[]
  additional?: string
  additionalPlain?: string
  workplaceType?: string
  country?: string
  salaryRange?: { min?: number; max?: number; currency?: string; interval?: string } | null
}

export function mapLever(payload: unknown): FeedPosting[] {
  if (!Array.isArray(payload)) throw new FeedError("Unexpected Lever response")
  const out: FeedPosting[] = []
  for (const p of payload as LeverPosting[]) {
    if (!p?.id || !p.text || !(p.hostedUrl || p.applyUrl)) continue
    const lists = (p.lists || [])
      .map((l) => `${l.text || ""}\n${htmlToText(l.content || "")}`.trim())
      .filter(Boolean)
      .join("\n\n")
    const body = [p.descriptionPlain || htmlToText(p.description || ""), lists, p.additionalPlain || htmlToText(p.additional || "")]
      .filter(Boolean)
      .join("\n\n")
    out.push({
      externalId: p.id,
      title: p.text.trim(),
      location: p.categories?.location?.trim() || null,
      locations: p.categories?.allLocations || [],
      descriptionText: body.trim(),
      applyUrl: (p.hostedUrl || p.applyUrl) as string,
      department: p.categories?.team || p.categories?.department || null,
      commitment: p.categories?.commitment || null,
      workplaceType: p.workplaceType && p.workplaceType !== "unspecified" ? p.workplaceType : null,
      salary: p.salaryRange || null,
      postedAt: typeof p.createdAt === "number" ? new Date(p.createdAt) : null,
      country: p.country || null,
    })
  }
  return out
}

/* ───────────────────────── Ashby ───────────────────────── */

interface AshbyJob {
  id?: string
  title?: string
  location?: string
  secondaryLocations?: { location?: string }[]
  department?: string
  team?: string
  employmentType?: string
  isRemote?: boolean
  workplaceType?: string
  descriptionPlain?: string
  descriptionHtml?: string
  jobUrl?: string
  applyUrl?: string
  publishedAt?: string
  isListed?: boolean
  address?: { postalAddress?: { addressLocality?: string; addressRegion?: string; addressCountry?: string } }
  compensation?: {
    summaryComponents?: { compensationType?: string; interval?: string; currencyCode?: string; minValue?: number; maxValue?: number }[]
  }
}

export function mapAshby(payload: unknown): FeedPosting[] {
  const jobs = (payload as { jobs?: AshbyJob[] })?.jobs
  if (!Array.isArray(jobs)) throw new FeedError("Unexpected Ashby response")
  const out: FeedPosting[] = []
  for (const j of jobs) {
    if (!j?.id || !j.title || !(j.jobUrl || j.applyUrl) || j.isListed === false) continue
    const pay = j.compensation?.summaryComponents?.find((c) => /salary/i.test(c.compensationType || ""))
    const workplace = (j.workplaceType || "").toLowerCase()
    out.push({
      externalId: j.id,
      title: j.title.trim(),
      location: j.location?.trim() || null,
      locations: [j.location, ...(j.secondaryLocations || []).map((s) => s.location)].filter((l): l is string => !!l),
      descriptionText: j.descriptionPlain?.trim() || htmlToText(j.descriptionHtml || ""),
      applyUrl: (j.jobUrl || j.applyUrl) as string,
      department: j.department || j.team || null,
      commitment: j.employmentType || null,
      workplaceType:
        j.isRemote || workplace === "remote" ? "remote" : workplace === "hybrid" ? "hybrid" : workplace === "onsite" ? "on-site" : null,
      salary: pay
        ? { min: pay.minValue, max: pay.maxValue, currency: pay.currencyCode, interval: /month/i.test(pay.interval || "") ? "per-month" : "per-year" }
        : null,
      postedAt: j.publishedAt ? new Date(j.publishedAt) : null,
      country: j.address?.postalAddress?.addressCountry || null,
      city: j.address?.postalAddress?.addressLocality || null,
    })
  }
  return out
}

/* ───────────────────────── SmartRecruiters ───────────────────────── */

interface SmartRecruitersPosting {
  id?: string
  name?: string
  releasedDate?: string
  location?: { city?: string; country?: string; region?: string; remote?: boolean; hybrid?: boolean; fullLocation?: string }
  department?: { label?: string }
  function?: { label?: string }
  typeOfEmployment?: { label?: string }
  experienceLevel?: { label?: string }
  company?: { identifier?: string }
}

export function mapSmartRecruiters(payload: unknown, token: string): FeedPosting[] {
  const content = (payload as { content?: SmartRecruitersPosting[] })?.content
  if (!Array.isArray(content)) throw new FeedError("Unexpected SmartRecruiters response")
  const out: FeedPosting[] = []
  for (const p of content) {
    if (!p?.id || !p.name) continue
    const loc = p.location || {}
    const full = (loc.fullLocation || [loc.city, loc.region, loc.country].filter(Boolean).join(", ")).replace(/,\s*,/g, ",").trim()
    out.push({
      externalId: String(p.id),
      title: p.name.trim(),
      location: full || null,
      locations: [],
      // The list API has no description; syncFeed fills it for new postings (enrichSmartRecruiters).
      descriptionText: "",
      applyUrl: `https://jobs.smartrecruiters.com/${encodeURIComponent(token)}/${encodeURIComponent(String(p.id))}`,
      department: p.department?.label || p.function?.label || null,
      commitment: p.typeOfEmployment?.label || null,
      workplaceType: loc.remote ? "remote" : loc.hybrid ? "hybrid" : null,
      salary: null,
      postedAt: p.releasedDate ? new Date(p.releasedDate) : null,
      country: loc.country || null,
      city: loc.city || null,
      experienceHint: p.experienceLevel?.label || null,
    })
  }
  return out
}

/** Fetches full descriptions for some SmartRecruiters postings (the list API has none). */
export async function enrichSmartRecruiters(
  token: string,
  postings: FeedPosting[],
  fetchImpl: FetchLike = fetch,
  opts: { max?: number; concurrency?: number } = {}
): Promise<number> {
  const queue = postings.slice(0, opts.max ?? 150)
  let filled = 0
  const worker = async () => {
    for (let p = queue.shift(); p; p = queue.shift()) {
      try {
        const res = await fetchImpl(
          `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(token)}/postings/${encodeURIComponent(p.externalId)}`,
          { headers: { Accept: "application/json", "User-Agent": UA }, signal: AbortSignal.timeout(15_000), cache: "no-store" }
        )
        if (!res.ok) continue
        const d = (await res.json()) as {
          postingUrl?: string
          jobAd?: { sections?: Record<string, { title?: string; text?: string } | undefined> }
        }
        const s = d.jobAd?.sections || {}
        const text = ["jobDescription", "qualifications", "additionalInformation", "companyDescription"]
          .map((k) => s[k])
          .filter((x): x is { title?: string; text?: string } => !!x?.text)
          .map((x) => `${x.title ? `${x.title}\n` : ""}${htmlToText(x.text)}`)
          .join("\n\n")
          .trim()
        if (text) {
          p.descriptionText = text
          filled++
        }
        if (d.postingUrl) p.applyUrl = d.postingUrl
      } catch {
        // keep the posting without a description
      }
    }
  }
  await Promise.all(Array.from({ length: opts.concurrency ?? 8 }, worker))
  return filled
}

/* ───────────────────────── Workable ───────────────────────── */

interface WorkableJob {
  title?: string
  shortcode?: string
  employment_type?: string
  telecommuting?: boolean
  department?: string
  url?: string
  shortlink?: string
  published_on?: string
  created_at?: string
  country?: string
  city?: string
  state?: string
  experience?: string
  description?: string
  locations?: { country?: string; countryCode?: string; city?: string; region?: string; hidden?: boolean }[]
}

export function mapWorkable(payload: unknown): FeedPosting[] {
  const jobs = (payload as { jobs?: WorkableJob[] })?.jobs
  if (!Array.isArray(jobs)) throw new FeedError("Unexpected Workable response")
  const out: FeedPosting[] = []
  for (const j of jobs) {
    if (!j?.shortcode || !j.title || !(j.url || j.shortlink)) continue
    const locs = (j.locations || []).filter((l) => !l.hidden)
    const label = (l: { city?: string; region?: string; country?: string }) => [l.city, l.region, l.country].filter(Boolean).join(", ")
    const first = locs[0] || { city: j.city, region: j.state, country: j.country }
    const posted = j.published_on || j.created_at
    out.push({
      externalId: j.shortcode,
      title: j.title.trim(),
      location: label(first) || null,
      locations: locs.slice(1).map(label).filter(Boolean),
      descriptionText: htmlToText(j.description || ""),
      applyUrl: (j.url || j.shortlink) as string,
      department: j.department || null,
      commitment: j.employment_type || null,
      workplaceType: j.telecommuting ? "remote" : null,
      salary: null,
      postedAt: posted ? new Date(posted) : null,
      country: locs[0]?.countryCode || first.country || null,
      city: first.city || null,
      experienceHint: j.experience || null,
    })
  }
  return out
}

/* ───────────────────────── Recruitee ───────────────────────── */

interface RecruiteeOffer {
  id?: number
  slug?: string
  title?: string
  description?: string
  requirements?: string
  location?: string
  city?: string
  country?: string
  country_code?: string
  remote?: boolean
  hybrid?: boolean
  careers_url?: string
  published_at?: string
  created_at?: string
  employment_type_code?: string
  department?: string
  status?: string
  salary?: { min?: number | string | null; max?: number | string | null; currency?: string | null; period?: string | null } | null
  locations?: { city?: string; country?: string; country_code?: string; name?: string }[]
}

export function mapRecruitee(payload: unknown): FeedPosting[] {
  const offers = (payload as { offers?: RecruiteeOffer[] })?.offers
  if (!Array.isArray(offers)) throw new FeedError("Unexpected Recruitee response")
  const out: FeedPosting[] = []
  for (const o of offers) {
    if (o?.id == null || !o.title || !o.careers_url || (o.status && o.status !== "published")) continue
    const num = (v: number | string | null | undefined) => (v == null || v === "" ? null : Number(v))
    const posted = o.published_at || o.created_at
    out.push({
      externalId: String(o.id),
      title: o.title.trim(),
      location: o.location || [o.city, o.country].filter(Boolean).join(", ") || null,
      locations: (o.locations || []).slice(1).map((l) => [l.city, l.country].filter(Boolean).join(", ")).filter(Boolean),
      descriptionText: [htmlToText(o.description || ""), htmlToText(o.requirements || "")].filter(Boolean).join("\n\n"),
      applyUrl: o.careers_url,
      department: o.department || null,
      commitment: o.employment_type_code ? o.employment_type_code.replace(/_/g, " ") : null,
      workplaceType: o.remote ? "remote" : o.hybrid ? "hybrid" : null,
      salary:
        o.salary && (o.salary.min || o.salary.max)
          ? { min: num(o.salary.min), max: num(o.salary.max), currency: o.salary.currency, interval: /month/i.test(o.salary.period || "") ? "per-month" : "per-year" }
          : null,
      postedAt: posted ? new Date(posted.replace(" UTC", "Z").replace(" ", "T")) : null,
      country: o.country_code || o.country || null,
      city: o.city || null,
    })
  }
  return out
}

/* ───────────────────────── Personio (XML) ───────────────────────── */

export function mapPersonio(xml: string, token: string): FeedPosting[] {
  if (!/<workzag-jobs[\s>]/.test(xml)) throw new FeedError("Unexpected Personio response")
  const $ = cheerio.load(xml, { xmlMode: true })
  const out: FeedPosting[] = []
  $("position").each((_, el) => {
    const p = $(el)
    const id = p.children("id").first().text().trim()
    const title = p.children("name").first().text().trim()
    if (!id || !title) return
    const offices = [p.children("office").first().text().trim(), ...p.find("additionalOffices office").map((_, o) => $(o).text().trim()).get()].filter(Boolean)
    const body = p
      .find("jobDescription")
      .map((_, d) => `${$(d).children("name").text().trim()}\n${htmlToText($(d).children("value").text())}`.trim())
      .get()
      .join("\n\n")
    const created = p.children("createdAt").first().text().trim()
    out.push({
      externalId: id,
      title,
      location: offices[0] || null,
      locations: offices.slice(1),
      descriptionText: body,
      applyUrl: `https://${token}.jobs.personio.de/job/${encodeURIComponent(id)}`,
      department: p.children("department").first().text().trim() || null,
      commitment: p.children("employmentType").first().text().trim() || p.children("schedule").first().text().trim() || null,
      workplaceType: null,
      salary: null,
      postedAt: created ? new Date(created) : null,
      experienceHint: p.children("yearsOfExperience").first().text().trim() || null,
    })
  })
  return out
}

/* ───────────────────────── Breezy ───────────────────────── */

interface BreezyJob {
  id?: string
  name?: string
  url?: string
  published_date?: string
  type?: { name?: string }
  location?: { name?: string; city?: string; country?: { id?: string; name?: string }; is_remote?: boolean; remote_details?: { value?: string } }
  department?: string
}

export function mapBreezy(payload: unknown): FeedPosting[] {
  if (!Array.isArray(payload)) throw new FeedError("Unexpected Breezy response")
  const out: FeedPosting[] = []
  for (const j of payload as BreezyJob[]) {
    if (!j?.id || !j.name || !j.url) continue
    const loc = j.location || {}
    const remote = loc.remote_details?.value
    out.push({
      externalId: j.id,
      title: j.name.trim(),
      location: loc.name || null,
      locations: [],
      descriptionText: "",
      applyUrl: j.url,
      department: j.department || null,
      commitment: j.type?.name || null,
      workplaceType: remote === "hybrid" ? "hybrid" : loc.is_remote ? "remote" : null,
      salary: null,
      postedAt: j.published_date ? new Date(j.published_date) : null,
      country: loc.country?.id && loc.country.id !== "worldwide" ? loc.country.id : loc.country?.name || null,
      city: loc.city || null,
    })
  }
  return out
}

/* ───────────────────────── fetch ───────────────────────── */

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

const UA = "ChayanJobsBot/1.0 (+job-board sync)"

async function getJson(url: string, fetchImpl: FetchLike, timeoutMs: number): Promise<unknown> {
  const res = await fetchImpl(url, { headers: { Accept: "application/json", "User-Agent": UA }, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" })
  if (res.status === 404) throw new FeedError("Board not found - check the board token", 404)
  if (!res.ok) throw new FeedError(`Source returned HTTP ${res.status}`, res.status)
  return res.json()
}

/** SmartRecruiters pages at 100; very large employers are capped so one board cannot dominate. */
export const SMARTRECRUITERS_MAX = 3000

export async function fetchFeed(
  provider: FeedProvider,
  token: string,
  fetchImpl: FetchLike = fetch,
  timeoutMs = 20_000
): Promise<FeedPosting[]> {
  if (!isValidBoardToken(token)) throw new FeedError("Invalid board token")
  if (provider === "SMARTRECRUITERS") {
    const all: FeedPosting[] = []
    for (let offset = 0; offset < SMARTRECRUITERS_MAX; offset += 100) {
      const page = (await getJson(`${feedApiUrl(provider, token)}&offset=${offset}`, fetchImpl, timeoutMs)) as { totalFound?: number }
      const mapped = mapSmartRecruiters(page, token)
      all.push(...mapped)
      if (mapped.length < 100 || all.length >= (page.totalFound ?? 0)) break
    }
    return all
  }
  if (provider === "PERSONIO") {
    const res = await fetchImpl(feedApiUrl(provider, token), { headers: { Accept: "application/xml", "User-Agent": UA }, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" })
    if (res.status === 404) throw new FeedError("Board not found - check the board token", 404)
    if (!res.ok) throw new FeedError(`Source returned HTTP ${res.status}`, res.status)
    return mapPersonio(await res.text(), token)
  }
  const json = await getJson(feedApiUrl(provider, token), fetchImpl, timeoutMs)
  switch (provider) {
    case "GREENHOUSE":
      return mapGreenhouse(json)
    case "ASHBY":
      return mapAshby(json)
    case "WORKABLE":
      return mapWorkable(json)
    case "RECRUITEE":
      return mapRecruitee(json)
    case "BREEZY":
      return mapBreezy(json)
    default:
      return mapLever(json)
  }
}
