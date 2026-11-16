import { createHash } from "crypto"
import { z } from "zod"
import { decodeEntities, htmlToText } from "@/lib/private-jobs/normalize"
import { fetchFeed, FeedError, type FeedPosting, type FeedProvider, type FetchLike } from "@/lib/private-jobs/feeds"
import { geminiJson } from "@/lib/private-jobs/llm"

/**
 * Reads any company careers page, most-accurate method first:
 *  1. schema.org JobPosting JSON-LD in the page (structured, exact)
 *  2. an embedded Greenhouse / Lever / Ashby board (delegated to its JSON API)
 *  3. Gemini extraction from the page text, grounded: every job title must appear
 *     in the page and apply links must be links that are really on the page.
 * The LLM is skipped when the page text has not changed since the last read.
 */

export type CareerMethod = "jsonld" | "ats" | "ai" | "unchanged" | "none"

export interface CareerPageResult {
  postings: FeedPosting[]
  method: CareerMethod
  pageHash: string | null
  /** Human-readable explanation for the admin panel (why nothing was found, what was detected). */
  note: string | null
  /** Embedded ATS board found on the page. */
  ats: { provider: FeedProvider; token: string } | null
  aiUsed: boolean
  /** True when the LLM was needed but not allowed this run (budget); try again later. */
  deferred: boolean
}

const UA = "ChayanJobsBot/1.0 (+careers-page reader; respects robots.txt)"
const MAX_HTML_BYTES = 3_000_000
const MAX_TEXT_FOR_AI = 24_000
const MAX_LINKS_FOR_AI = 250
const sha = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 32)

/* ───────────────────────── safety: URL + robots ───────────────────────── */

const PRIVATE_HOST = /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|\[?::1\]?|\[?f[cd][0-9a-f]{2}:.*)$/i

/** Public http(s) URL only - the server must never be pointed at internal hosts. */
export function safeCareerUrl(input: string): URL | null {
  try {
    const u = new URL(input.trim())
    if (u.protocol !== "https:" && u.protocol !== "http:") return null
    if (u.username || u.password) return null
    if (PRIVATE_HOST.test(u.hostname)) return null
    if (!u.hostname.includes(".")) return null
    u.hash = ""
    return u
  } catch {
    return null
  }
}

/** Disallow rules for "*" or our bot in robots.txt. */
export function robotsDisallows(robotsTxt: string, path: string): boolean {
  let applies = false
  let inAgentBlock = false
  const disallow: string[] = []
  for (const raw of robotsTxt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim()
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i)
    if (!m) continue
    const key = m[1].toLowerCase()
    const val = m[2].trim()
    if (key === "user-agent") {
      if (!inAgentBlock) applies = false
      inAgentBlock = true
      if (val === "*" || /chayanjobsbot/i.test(val)) applies = true
    } else {
      inAgentBlock = false
      if (applies && key === "disallow" && val) disallow.push(val)
    }
  }
  return disallow.some((rule) => {
    const re = new RegExp("^" + rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"))
    return re.test(path)
  })
}

async function fetchText(url: string, fetchImpl: FetchLike, timeoutMs = 20_000): Promise<{ status: number; text: string; finalUrl: string }> {
  const res = await fetchImpl(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: "follow",
    cache: "no-store",
  })
  const buf = await res.arrayBuffer()
  return { status: res.status, text: new TextDecoder().decode(buf.slice(0, MAX_HTML_BYTES)), finalUrl: res.url || url }
}

/* ───────────────────────── 1. JSON-LD ───────────────────────── */

type Ld = Record<string, unknown>
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? decodeEntities(v.trim()) : null)

function collectJobPostings(node: unknown, out: Ld[]) {
  if (Array.isArray(node)) return node.forEach((n) => collectJobPostings(n, out))
  if (!node || typeof node !== "object") return
  const o = node as Ld
  const type = o["@type"]
  if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) out.push(o)
  if (o["@graph"]) collectJobPostings(o["@graph"], out)
  if (o.itemListElement) collectJobPostings(o.itemListElement, out)
  if (o.item) collectJobPostings(o.item, out)
}

function ldLocation(loc: unknown): string | null {
  const list = Array.isArray(loc) ? loc : loc ? [loc] : []
  const parts = list
    .map((l) => {
      const addr = (l as Ld)?.address as Ld | string | undefined
      if (typeof addr === "string") return addr
      if (!addr) return str((l as Ld)?.name)
      return [str(addr.addressLocality), str(addr.addressRegion), str(addr.addressCountry as string)].filter(Boolean).join(", ")
    })
    .filter(Boolean)
  return parts.length ? parts.join(" / ") : null
}

export function extractJsonLdPostings(html: string, pageUrl: string): FeedPosting[] {
  const found: Ld[] = []
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      collectJobPostings(JSON.parse(m[1].trim()), found)
    } catch {
      // malformed block - ignore
    }
  }
  const out: FeedPosting[] = []
  for (const j of found) {
    const title = str(j.title)
    if (!title) continue
    const url = str(j.url) || pageUrl
    const ident = j.identifier as Ld | string | undefined
    const id = typeof ident === "string" ? ident : str(ident?.value) || url + "#" + title
    const salary = j.baseSalary as Ld | undefined
    const value = (salary?.value ?? {}) as Ld
    const unit = String(value.unitText || "").toUpperCase()
    const remote = String(j.jobLocationType || "").toUpperCase() === "TELECOMMUTE"
    out.push({
      externalId: sha(String(id)),
      title,
      location: ldLocation(j.jobLocation) || (remote ? "Remote" : null),
      locations: [],
      descriptionText: htmlToText(str(j.description) || ""),
      applyUrl: url,
      department: str((j.occupationalCategory as string) ?? null),
      commitment: Array.isArray(j.employmentType) ? String(j.employmentType[0]) : str(j.employmentType),
      workplaceType: remote ? "remote" : null,
      salary: salary
        ? {
            min: Number(value.minValue ?? value.value) || null,
            max: Number(value.maxValue) || null,
            currency: str(salary.currency) || null,
            interval: unit === "MONTH" ? "per-month" : unit === "HOUR" ? "per-hour" : "per-year",
          }
        : null,
      postedAt: str(j.datePosted) ? new Date(str(j.datePosted) as string) : null,
    })
  }
  return out.filter((p) => !p.postedAt || !Number.isNaN(p.postedAt.getTime()))
}

/* ───────────────────────── 2. embedded ATS ───────────────────────── */

const ATS_PATTERNS: { provider: FeedProvider; re: RegExp }[] = [
  { provider: "GREENHOUSE", re: /(?:boards|job-boards)\.greenhouse\.io\/(?:embed\/job_board\?for=)?([A-Za-z0-9._-]+)/i },
  { provider: "GREENHOUSE", re: /boards-api\.greenhouse\.io\/v1\/boards\/([A-Za-z0-9._-]+)/i },
  { provider: "GREENHOUSE", re: /greenhouse\.io\/embed\/job_board(?:\/js)?\?for=([A-Za-z0-9._-]+)/i },
  { provider: "LEVER", re: /jobs\.lever\.co\/([A-Za-z0-9._-]+)/i },
  { provider: "LEVER", re: /api\.lever\.co\/v0\/postings\/([A-Za-z0-9._-]+)/i },
  { provider: "ASHBY", re: /jobs\.ashbyhq\.com\/([A-Za-z0-9._-]+)/i },
  { provider: "ASHBY", re: /api\.ashbyhq\.com\/posting-api\/job-board\/([A-Za-z0-9._-]+)/i },
  { provider: "SMARTRECRUITERS", re: /(?:careers|jobs)\.smartrecruiters\.com\/([A-Za-z0-9._-]+)/i },
  { provider: "SMARTRECRUITERS", re: /api\.smartrecruiters\.com\/v1\/companies\/([A-Za-z0-9._-]+)/i },
  { provider: "WORKABLE", re: /apply\.workable\.com\/(?!api\/|j\/)([A-Za-z0-9._-]+)/i },
  { provider: "WORKABLE", re: /\/\/([a-z0-9-]+)\.workable\.com/i },
  { provider: "RECRUITEE", re: /\/\/([a-z0-9-]+)\.recruitee\.com/i },
  { provider: "PERSONIO", re: /\/\/([a-z0-9-]+)\.jobs\.personio\.(?:de|com)/i },
  { provider: "BREEZY", re: /\/\/([a-z0-9-]+)\.breezy\.hr/i },
]
const NOT_TOKENS = new Set(["embed", "v1", "v0", "js", "jobs", "api", "job_board", "postings", "www", "apply", "app", "assets", "cdn", "static", "careers", "help", "support", "blog"])

export function detectAtsBoard(html: string): { provider: FeedProvider; token: string } | null {
  for (const { provider, re } of ATS_PATTERNS) {
    const m = html.match(re)
    if (m && !NOT_TOKENS.has(m[1].toLowerCase())) return { provider, token: m[1] }
  }
  return null
}

/* ───────────────────────── 3. Gemini ───────────────────────── */

export interface PageLink {
  text: string
  url: string
}

export function extractLinks(html: string, baseUrl: string): PageLink[] {
  const seen = new Set<string>()
  const out: PageLink[] = []
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let url: string
    try {
      url = new URL(decodeEntities(m[1]), baseUrl).toString()
    } catch {
      continue
    }
    if (!/^https?:/.test(url) || seen.has(url)) continue
    const text = htmlToText(m[2]).replace(/\s+/g, " ").slice(0, 120)
    if (!text) continue
    seen.add(url)
    out.push({ text, url })
  }
  return out
}

export const CAREER_SYSTEM_PROMPT = `You read ONE company careers web page and list the job openings shown on it, for an Indian job website.
Rules:
- Only list openings that are actually on the page. Never invent jobs, locations, salaries or links.
- Copy each job title exactly as written on the page.
- "linkIndex" is the number of the link (from the LINKS list) that opens that specific job or its application; null if there is none.
- location, experience and salary: copy the page's own words, or null when the page does not state them.
- summary: at most 2 short sentences describing the role, only from the page text; null if nothing is said.
- confidence: 0 to 1, how sure you are this is a real, currently open job listed on this page.
- If the page is not a list of job openings (e.g. a culture page, a login wall, cookie text only), return {"isJobListing": false, "jobs": []}.
Reply with JSON only.`

const aiJobSchema = z.object({
  title: z.string().min(2).max(200),
  location: z.string().max(200).nullish(),
  linkIndex: z.number().int().nonnegative().nullish(),
  department: z.string().max(120).nullish(),
  employmentType: z.string().max(60).nullish(),
  experience: z.string().max(120).nullish(),
  salary: z.string().max(120).nullish(),
  summary: z.string().max(600).nullish(),
  confidence: z.number().min(0).max(1),
})
export const aiReplySchema = z.object({
  isJobListing: z.boolean(),
  jobs: z.array(aiJobSchema).max(200),
})

export function buildCareerPrompt(pageUrl: string, companyName: string, text: string, links: PageLink[]): string {
  const linkList = links
    .slice(0, MAX_LINKS_FOR_AI)
    .map((l, i) => `[${i}] ${l.text} -> ${l.url}`)
    .join("\n")
  return `COMPANY: ${companyName}
PAGE: ${pageUrl}

PAGE TEXT:
${text.slice(0, MAX_TEXT_FOR_AI)}

LINKS:
${linkList || "(none)"}

Return {"isJobListing": boolean, "jobs": [{"title": string, "location": string|null, "linkIndex": number|null, "department": string|null, "employmentType": string|null, "experience": string|null, "salary": string|null, "summary": string|null, "confidence": number}]}`
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

/** Keeps only what the page itself supports; returns grounded postings. */
export function groundAiJobs(reply: z.infer<typeof aiReplySchema>, pageText: string, links: PageLink[], pageUrl: string): FeedPosting[] {
  if (!reply.isJobListing) return []
  const text = squash(pageText)
  const inPage = (v?: string | null) => (v && squash(v) && text.includes(squash(v)) ? v.trim() : null)
  const out: FeedPosting[] = []
  const seen = new Set<string>()
  for (const j of reply.jobs) {
    const title = inPage(j.title)
    if (!title) continue // hallucinated or reworded title: drop the job
    const link = j.linkIndex != null && j.linkIndex < Math.min(links.length, MAX_LINKS_FOR_AI) ? links[j.linkIndex] : null
    const applyUrl = link?.url ?? pageUrl
    const location = inPage(j.location)
    const key = link ? applyUrl : `${title}|${location ?? ""}`
    if (seen.has(key)) continue
    seen.add(key)
    const facts = [inPage(j.experience), inPage(j.salary)].filter(Boolean).join("\n")
    out.push({
      externalId: sha(key),
      title,
      location,
      locations: [],
      descriptionText: [j.summary?.trim(), facts].filter(Boolean).join("\n\n"),
      applyUrl,
      department: inPage(j.department),
      commitment: inPage(j.employmentType),
      workplaceType: null,
      salary: null,
      postedAt: null,
      // Without its own link the job cannot be told apart reliably: lower confidence.
      confidence: Math.round(Math.min(1, j.confidence * (link ? 1 : 0.8)) * 100) / 100,
    })
  }
  return out
}

/* ───────────────────────── entry point ───────────────────────── */

export async function readCareerPage(
  rawUrl: string,
  opts: {
    companyName: string
    previousHash?: string | null
    allowAi?: boolean
    model?: string | null
    fetchImpl?: FetchLike
  }
): Promise<CareerPageResult> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const url = safeCareerUrl(rawUrl)
  if (!url) throw new FeedError("Enter a public http(s) careers page URL", 400)
  const base: Omit<CareerPageResult, "method"> = { postings: [], pageHash: null, note: null, ats: null, aiUsed: false, deferred: false }

  try {
    const robots = await fetchText(`${url.origin}/robots.txt`, fetchImpl, 8_000)
    if (robots.status === 200 && robotsDisallows(robots.text, url.pathname)) {
      throw new FeedError("robots.txt does not allow reading this page", 403)
    }
  } catch (e) {
    if (e instanceof FeedError) throw e
    // no robots.txt reachable = allowed
  }

  const page = await fetchText(url.toString(), fetchImpl)
  if (page.status === 404 || page.status === 410) throw new FeedError("Careers page not found", 404)
  if (page.status >= 400) throw new FeedError(`Careers page returned HTTP ${page.status}`, page.status)
  const html = page.text
  const finalUrl = page.finalUrl

  const ld = extractJsonLdPostings(html, finalUrl)
  if (ld.length) return { ...base, method: "jsonld", postings: ld, note: `${ld.length} structured job postings (JSON-LD) on the page` }

  const ats = detectAtsBoard(html)
  if (ats) {
    const postings = await fetchFeed(ats.provider, ats.token, fetchImpl)
    return {
      ...base,
      method: "ats",
      ats,
      postings,
      note: `Page embeds the ${ats.provider.toLowerCase()} board "${ats.token}" - read through its official API`,
    }
  }

  const body = html.replace(/<(script|style|noscript|svg|nav|footer)[\s\S]*?<\/\1>/gi, " ")
  const text = htmlToText(body)
  const links = extractLinks(body, finalUrl)
  const pageHash = sha(text + "\n" + links.map((l) => l.url).join("\n"))
  if (opts.previousHash && opts.previousHash === pageHash) {
    return { ...base, method: "unchanged", pageHash, note: "Page unchanged since the last read - no AI call needed" }
  }
  if (text.length < 200) {
    return {
      ...base,
      method: "none",
      pageHash,
      note: "The page has almost no text - it is probably rendered by JavaScript. Add the company's job board (Greenhouse / Lever / Ashby) instead.",
    }
  }
  if (opts.allowAi === false) {
    return { ...base, method: "none", deferred: true, note: "AI reading budget for this run is used up - picked up on the next run" }
  }

  const raw = await geminiJson(CAREER_SYSTEM_PROMPT, buildCareerPrompt(finalUrl, opts.companyName, text, links), { model: opts.model, fetchImpl: opts.fetchImpl })
  const parsed = aiReplySchema.safeParse(raw)
  if (!parsed.success) throw new FeedError("Gemini returned an unexpected format - retried on the next run", 502)
  const postings = groundAiJobs(parsed.data, text, links, finalUrl)
  const dropped = parsed.data.jobs.length - postings.length
  return {
    ...base,
    method: "ai",
    aiUsed: true,
    pageHash,
    postings,
    note: parsed.data.isJobListing
      ? `Gemini found ${parsed.data.jobs.length} jobs${dropped ? `, ${dropped} dropped (not verifiable on the page)` : ""}`
      : "Gemini: this page does not list job openings",
  }
}

export function careerPageKey(url: string): string {
  const u = safeCareerUrl(url)
  return "cp" + sha((u ? u.toString() : url).toLowerCase()).slice(0, 24)
}

