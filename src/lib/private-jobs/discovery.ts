import { prisma } from "@/lib/prisma"
import { findOrCreateCompany } from "@/lib/companies"
import { detectAtsBoard, safeCareerUrl } from "@/lib/private-jobs/career-page"
import { feedApiUrl, type FeedProvider, type FetchLike } from "@/lib/private-jobs/feeds"

/**
 * Finds a company's public job board from just its name (and website, when
 * known). Each ATS has a public, documented job-board endpoint; we probe the
 * likely board slugs and keep a board only when it lists openings and, where
 * the API reports one, the company name matches.
 *
 * Order: the website's careers page (an embedded board is exact) → slug probes
 * across all supported job boards.
 */

const UA = "ChayanJobsBot/1.0 (+job-board discovery)"
const TIMEOUT = 8000

const LEGAL = /\b(private|pvt|limited|ltd|llp|llc|inc|incorporated|corp|corporation|company|co|plc|gmbh|ag|sa|bv|nv|ab|oy|as|srl|spa|pte|pty|kk|the)\b\.?/gi

/** Board-slug spellings worth trying for a company name. */
export function slugCandidates(name: string): string[] {
  const base = name.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 .-]/g, " ")
  const core = base.replace(LEGAL, " ").replace(/\s+/g, " ").trim()
  const words = core.split(" ").filter(Boolean)
  if (!words.length) return []
  const out = new Set<string>([
    words.join(""),
    words.join("-"),
    core.replace(/[ .]/g, ""),
    words.filter((w) => !/^(technologies|technology|tech|labs?|software|solutions|systems|global|group|india|hq|inc|io|ai|app)$/.test(w)).join(""),
  ])
  return [...out].filter((s) => s.length >= 2 && /^[a-z0-9][a-z0-9.-]*$/.test(s)).slice(0, 4)
}

const compact = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(LEGAL, " ").replace(/[^a-z0-9]/g, "")

/** Loose company-name match ("Hugging Face" vs "HuggingFace Inc."). */
export function sameCompany(a: string, b: string): boolean {
  const x = compact(a)
  const y = compact(b)
  if (!x || !y) return false
  return x === y || (x.length >= 4 && y.startsWith(x)) || (y.length >= 4 && x.startsWith(y))
}

export interface DiscoveredBoard {
  provider: FeedProvider
  token: string
  jobs: number
  /** How it was found. */
  via: "website" | "probe"
}

async function getJson(url: string, fetchImpl: FetchLike): Promise<{ status: number; body: unknown }> {
  try {
    const res = await fetchImpl(url, { headers: { Accept: "application/json", "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT), cache: "no-store" })
    if (!res.ok) return { status: res.status, body: null }
    return { status: res.status, body: await res.json().catch(() => null) }
  } catch {
    return { status: 0, body: null }
  }
}

/** Probes one provider + slug. Returns the open-role count, or null when it is not this company's board. */
export async function probeBoard(provider: FeedProvider, token: string, name: string | null, fetchImpl: FetchLike): Promise<number | null> {
  switch (provider) {
    case "GREENHOUSE": {
      const meta = await getJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}`, fetchImpl)
      const boardName = (meta.body as { name?: string } | null)?.name
      if (!boardName || (name && !sameCompany(name, boardName))) return null
      const jobs = await getJson(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs`, fetchImpl)
      const n = (jobs.body as { jobs?: unknown[] } | null)?.jobs?.length ?? 0
      return n > 0 ? n : null
    }
    case "LEVER": {
      // No company name in the API: only exact-name slugs are probed for Lever (see discoverBoard).
      const r = await getJson(`https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json&limit=200`, fetchImpl)
      return Array.isArray(r.body) && r.body.length > 0 ? r.body.length : null
    }
    case "ASHBY": {
      const r = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}`, fetchImpl)
      const n = (r.body as { jobs?: unknown[] } | null)?.jobs?.length ?? 0
      return n > 0 ? n : null
    }
    case "SMARTRECRUITERS": {
      const r = await getJson(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(token)}/postings?limit=1`, fetchImpl)
      const body = r.body as { totalFound?: number; content?: { company?: { name?: string } }[] } | null
      const total = body?.totalFound ?? 0
      const co = body?.content?.[0]?.company?.name
      if (!total || (name && co && !sameCompany(name, co))) return null
      return total
    }
    case "WORKABLE": {
      const r = await getJson(`https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(token)}`, fetchImpl)
      const body = r.body as { name?: string; jobs?: unknown[] } | null
      if (!body?.jobs?.length || (name && body.name && !sameCompany(name, body.name))) return null
      return body.jobs.length
    }
    case "RECRUITEE": {
      const r = await getJson(`https://${encodeURIComponent(token)}.recruitee.com/api/offers/`, fetchImpl)
      const offers = (r.body as { offers?: { company_name?: string }[] } | null)?.offers ?? []
      const co = offers[0]?.company_name
      if (!offers.length || (name && co && !sameCompany(name, co))) return null
      return offers.length
    }
    case "BREEZY": {
      const r = await getJson(feedApiUrl(provider, token), fetchImpl)
      const jobs = Array.isArray(r.body) ? (r.body as { company?: { name?: string } }[]) : []
      const co = jobs[0]?.company?.name
      if (!jobs.length || (name && co && !sameCompany(name, co))) return null
      return jobs.length
    }
    case "PERSONIO": {
      // The XML feed has no company name: a found board must look like a real hiring page.
      try {
        const res = await fetchImpl(feedApiUrl(provider, token), { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(TIMEOUT), cache: "no-store" })
        if (!res.ok) return null
        const n = ((await res.text()).match(/<position>/g) || []).length
        return n >= MIN_JOBS_UNVERIFIED ? n : null
      } catch {
        return null
      }
    }
  }
  return null
}

/** Boards whose API cannot confirm the company name need at least this many openings. */
export const MIN_JOBS_UNVERIFIED = 3

/**
 * Same rule for a board found earlier (catalog build): look-alike boards of big
 * brands - test accounts like "Slack1" with one posting - are left out.
 */
export function plausibleBoard(b: { provider: string; token: string; jobs?: number | null }): boolean {
  const jobs = b.jobs ?? 0
  if (b.provider === "SMARTRECRUITERS") return jobs >= (/\d$|Group$/.test(b.token) ? 5 : MIN_JOBS_UNVERIFIED)
  if (b.provider === "PERSONIO" || b.provider === "BREEZY") return jobs >= MIN_JOBS_UNVERIFIED
  return jobs > 0
}

async function boardFromWebsite(website: string, fetchImpl: FetchLike): Promise<{ provider: FeedProvider; token: string } | null> {
  let origin: string
  try {
    origin = new URL(/^https?:/i.test(website) ? website : `https://${website}`).origin
  } catch {
    return null
  }
  for (const path of ["/careers", "/jobs", "/careers/", "/company/careers", "/about/careers", "/"]) {
    const url = safeCareerUrl(`${origin}${path}`)
    if (!url) return null
    try {
      const res = await fetchImpl(url.toString(), { headers: { "User-Agent": UA, Accept: "text/html" }, signal: AbortSignal.timeout(TIMEOUT), redirect: "follow" })
      if (!res.ok) continue
      const hit = detectAtsBoard((await res.text()).slice(0, 1_500_000))
      if (hit) return hit
    } catch {
      // try the next path
    }
  }
  return null
}

/** Order matters: high-signal providers (name verified by the API) first. */
const PROBE_ORDER: FeedProvider[] = ["GREENHOUSE", "SMARTRECRUITERS", "WORKABLE", "ASHBY", "LEVER", "RECRUITEE", "PERSONIO", "BREEZY"]

export async function discoverBoard(
  input: { name: string; website?: string | null },
  opts: { fetchImpl?: FetchLike; deadline?: number } = {}
): Promise<DiscoveredBoard | null> {
  const fetchImpl = opts.fetchImpl ?? (fetch as FetchLike)
  const deadline = opts.deadline ?? Date.now() + 30_000
  if (input.website) {
    const hit = await boardFromWebsite(input.website, fetchImpl)
    if (hit) {
      const jobs = await probeBoard(hit.provider, hit.token, null, fetchImpl)
      if (jobs) return { ...hit, jobs, via: "website" }
    }
  }
  const slugs = slugCandidates(input.name)
  const exact = compact(input.name)
  for (const provider of PROBE_ORDER) {
    for (const slug of slugs) {
      if (Date.now() > deadline) return null
      // Providers whose API does not report the company name: only the exact-name slug, to avoid look-alikes.
      const unverified = provider === "LEVER" || provider === "ASHBY" || provider === "PERSONIO" || provider === "BREEZY"
      if (unverified && slug.replace(/[-.]/g, "") !== exact) continue
      if (provider === "SMARTRECRUITERS") {
        // The identifier is the name, sometimes with a suffix (BoschGroup, Ubisoft2, LinkedIn3).
        const base = input.name.replace(LEGAL, " ").replace(/[^A-Za-z0-9]/g, "") || slug
        for (const token of [base, `${base}Group`, `${base}1`, `${base}2`, `${base}3`]) {
          if (Date.now() > deadline) return null
          const jobs = await probeBoard(provider, token, input.name, fetchImpl)
          if (jobs && plausibleBoard({ provider, token, jobs })) return { provider, token, jobs, via: "probe" }
        }
        break
      }
      const jobs = await probeBoard(provider, slug, input.name, fetchImpl)
      if (jobs) return { provider, token: slug, jobs, via: "probe" }
    }
  }
  return null
}

/* ───────────────────────── queue processing ───────────────────────── */

export interface DiscoveryRunResult {
  checked: number
  found: number
  added: number
  /** Companies whose boards were added (for the logo lookup). */
  companyIds: string[]
  results: { name: string; status: string; provider?: string; token?: string; jobs?: number }[]
}

/**
 * Processes pending candidates within a time budget: a found board becomes an
 * enabled feed straight away (it syncs on the next run).
 */
export async function runDiscovery(opts: { limit?: number; budgetMs?: number; fetchImpl?: FetchLike; concurrency?: number } = {}): Promise<DiscoveryRunResult> {
  const started = Date.now()
  const budget = opts.budgetMs ?? 40_000
  const pending = await prisma.privateFeedCandidate.findMany({
    where: { status: "PENDING" },
    orderBy: [{ attempts: "asc" }, { createdAt: "asc" }],
    take: opts.limit ?? 40,
  })
  const result: DiscoveryRunResult = { checked: 0, found: 0, added: 0, companyIds: [], results: [] }
  const queue = [...pending]
  const worker = async () => {
    for (let c = queue.shift(); c; c = queue.shift()) {
      const left = budget - (Date.now() - started)
      if (left < 6000) return
      let status = "NOT_FOUND"
      let note: string | null = null
      let board: DiscoveredBoard | null = null
      let feedId: string | null = null
      try {
        board = await discoverBoard({ name: c.name, website: c.website }, { fetchImpl: opts.fetchImpl, deadline: Date.now() + Math.min(30_000, left - 3000) })
        if (board) {
          status = "FOUND"
          const existing = await prisma.privateJobFeed.findUnique({ where: { provider_boardToken: { provider: board.provider, boardToken: board.token } } })
          if (existing) {
            feedId = existing.id
            note = "Board was already added"
          } else {
            const company = await findOrCreateCompany(c.name, c.website)
            const feed = await prisma.privateJobFeed.create({
              data: { provider: board.provider, boardToken: board.token, companyId: company.id, indiaOnly: c.indiaOnly, createdById: c.createdById },
            })
            feedId = feed.id
            result.added++
            result.companyIds.push(company.id)
          }
          result.found++
        } else {
          note = "No public job board found (Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Recruitee, Personio, Breezy)"
        }
      } catch (e) {
        status = c.attempts >= 2 ? "ERROR" : "PENDING"
        note = e instanceof Error ? e.message.slice(0, 300) : "Discovery failed"
      }
      await prisma.privateFeedCandidate.update({
        where: { id: c.id },
        data: {
          status,
          note,
          provider: board?.provider ?? null,
          boardToken: board?.token ?? null,
          jobs: board?.jobs ?? null,
          feedId,
          attempts: { increment: 1 },
          checkedAt: new Date(),
        },
      })
      result.checked++
      result.results.push({ name: c.name, status, provider: board?.provider, token: board?.token, jobs: board?.jobs })
    }
  }
  await Promise.all(Array.from({ length: opts.concurrency ?? 6 }, worker))
  return result
}

/** Adds company names (optionally "Name | website") to the discovery queue; existing names are skipped. */
export async function queueCandidates(
  lines: string[],
  opts: { indiaOnly?: boolean; userId?: string | null } = {}
): Promise<{ queued: number; skipped: number }> {
  const rows = new Map<string, { name: string; website: string | null }>()
  for (const raw of lines) {
    const [namePart, sitePart] = raw.split(/\s*[|\t]\s*|\s+,\s+(?=https?:|www\.)/)
    const name = namePart?.trim().replace(/\s+/g, " ")
    if (!name || name.length > 150) continue
    const website = sitePart?.trim() || null
    if (rows.has(name.toLowerCase())) continue // the first spelling wins
    rows.set(name.toLowerCase(), { name, website: website && /\./.test(website) ? website : null })
  }
  if (!rows.size) return { queued: 0, skipped: 0 }
  const res = await prisma.privateFeedCandidate.createMany({
    data: [...rows.values()].map((r) => ({ name: r.name, website: r.website, indiaOnly: opts.indiaOnly ?? false, createdById: opts.userId ?? null })),
    skipDuplicates: true,
  })
  return { queued: res.count, skipped: rows.size - res.count }
}
