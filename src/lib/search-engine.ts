import "server-only"
import { prisma } from "@/lib/prisma"
import { buildBrowseUrl, normalizeExternalUrl } from "@/lib/apply-room"
import {
  SEARCH_KINDS,
  type SearchAction,
  type SearchHit,
  type SearchKind,
  type SearchResponse,
  type SearchSort,
} from "@/lib/search-types"

/* ───────────────────────── query understanding ───────────────────────── */

const STOPWORDS = new Set([
  "a", "an", "the", "for", "of", "in", "on", "at", "to", "and", "or", "by", "with", "from",
  "job", "jobs", "recruitment", "vacancy", "vacancies", "apply", "online", "form", "latest",
  "sarkari", "govt", "government", "new", "notification", "download", "official",
])

/** Each key expands to alternatives that are also accepted as a match. */
const SYNONYMS: Record<string, string[]> = {
  railway: ["rrb", "rrc", "railways", "indian railways"],
  rrb: ["railway", "railways"],
  bank: ["ibps", "sbi", "banking", "rbi"],
  banking: ["bank", "ibps", "sbi"],
  police: ["constable", "si", "sub inspector"],
  constable: ["police"],
  teacher: ["teaching", "tgt", "pgt", "prt", "ctet", "tet"],
  teaching: ["teacher", "tgt", "pgt", "prt"],
  army: ["agniveer", "defence", "military"],
  defence: ["army", "navy", "airforce", "air force", "agniveer"],
  navy: ["defence"],
  engineer: ["engineering", "je", "ae", "junior engineer"],
  engineering: ["engineer", "je", "ae"],
  nurse: ["nursing", "staff nurse", "anm", "gnm"],
  nursing: ["nurse", "staff nurse"],
  clerk: ["ldc", "udc", "assistant"],
  ssc: ["cgl", "chsl", "mts", "staff selection commission"],
  upsc: ["civil services", "ias", "ips", "union public service commission"],
  psc: ["public service commission"],
  wfh: ["remote", "work from home"],
  remote: ["work from home", "wfh"],
  fresher: ["freshers", "entry level", "graduate"],
  freshers: ["fresher", "entry level"],
  "10th": ["matric", "high school", "10th pass"],
  "12th": ["intermediate", "10+2", "12th pass"],
  graduate: ["graduation", "degree", "any graduate"],
}

export interface ParsedQuery {
  raw: string
  tokens: string[]
  /** Alternatives per token (token itself first). */
  groups: string[][]
  phrase: string
  kind: SearchKind | null
  openOnly: boolean
}

const KIND_ALIASES: Record<string, SearchKind> = {
  job: "job", jobs: "job", govt: "job", gov: "job",
  private: "private_job", privatejob: "private_job",
  result: "result", results: "result",
  admit: "admit_card", admitcard: "admit_card", hallticket: "admit_card",
  key: "answer_key", answerkey: "answer_key", answer: "answer_key",
  syllabus: "syllabus",
  admission: "admission", admissions: "admission",
  notification: "notification", notifications: "notification",
  blog: "blog", article: "blog",
}

export function parseQuery(input: string): ParsedQuery {
  let raw = input.trim().replace(/\s+/g, " ").slice(0, 160)
  let kind: SearchKind | null = null
  let openOnly = false

  // Operators: type:result  in:blog  is:open
  raw = raw.replace(/\b(?:type|in):(\w+)\b/gi, (_, v: string) => {
    const k = KIND_ALIASES[v.toLowerCase()]
    if (k) kind = k
    return " "
  })
  raw = raw.replace(/\bis:open\b/gi, () => {
    openOnly = true
    return " "
  })
  raw = raw.trim().replace(/\s+/g, " ")

  const words = raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+\s.-]/gu, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^[.-]+|[.-]+$/g, ""))
    .filter(Boolean)

  const meaningful = words.filter((w) => !STOPWORDS.has(w))
  const tokens = (meaningful.length ? meaningful : words).slice(0, 8)
  const groups = tokens.map((t) => [t, ...(SYNONYMS[t] ?? [])])
  return { raw, tokens, groups, phrase: tokens.join(" "), kind, openOnly }
}

/* ───────────────────────────── scoring ───────────────────────────────── */

interface Candidate {
  hit: Omit<SearchHit, "score" | "state"> & { state: SearchHit["state"] }
  /** Searchable text per weight tier. */
  title: string
  secondary: string
  body: string
  boost: number
}

function scoreCandidate(c: Candidate, q: ParsedQuery): { score: number; matched: number } {
  const title = c.title.toLowerCase()
  const secondary = c.secondary.toLowerCase()
  const body = c.body.toLowerCase()
  const titleWords = title.split(/[^\p{L}\p{N}+]+/u).filter(Boolean)
  let score = 0
  let matched = 0

  for (const group of q.groups) {
    let best = 0
    group.forEach((alt, i) => {
      const w = i === 0 ? 1 : 0.7
      let s = 0
      if (titleWords.includes(alt)) s = 10
      else if (titleWords.some((tw) => tw.startsWith(alt))) s = 8
      else if (title.includes(alt)) s = 6
      else if (secondary.includes(alt)) s = 4
      else if (body.includes(alt)) s = 1.5
      best = Math.max(best, s * w)
    })
    if (best > 0) matched += 1
    score += best
  }

  if (q.tokens.length > 1 && matched === q.tokens.length) {
    score += 6
    if (title.includes(q.phrase)) score += 14 // exact phrase in title
  }
  if (q.phrase && title.startsWith(q.phrase)) score += 8
  if (q.phrase && title === q.phrase) score += 20

  // Freshness (half-life ≈ 45 days) + popularity boost.
  const ageDays = Math.max(0, (Date.now() - new Date(c.hit.date).getTime()) / 86_400_000)
  score += 6 * Math.pow(0.5, ageDays / 45)
  score += c.boost
  if (c.hit.state === "open" || c.hit.state === "closing") score += 2
  if (c.hit.state === "closed") score -= 3
  return { score, matched }
}

/* ───────────────────────────── helpers ───────────────────────────────── */

const strip = (s: string | null | undefined, max = 180) => {
  if (!s) return null
  const t = s.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
  return t ? (t.length > max ? `${t.slice(0, max - 1)}…` : t) : null
}

function deadlineState(
  lastDate: Date | null,
  startDate?: Date | null
): SearchHit["state"] {
  if (startDate && startDate.getTime() > Date.now()) return "upcoming"
  if (!lastDate) return null
  const left = lastDate.getTime() - Date.now()
  if (left < 0) return "closed"
  if (left <= 5 * 86_400_000) return "closing"
  return "open"
}

/** Any external URL is wrapped in the in-app browser so it opens inside ChayanJobs. */
function browse(url: string | null | undefined, title: string): string | null {
  const n = normalizeExternalUrl(url)
  return n ? buildBrowseUrl(n, { title }) : null
}

function act(
  kind: SearchAction["kind"],
  label: string,
  href: string | null,
  primary = false
): SearchAction[] {
  return href ? [{ kind, label, href, primary }] : []
}

type Row = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

function tokenOr(q: ParsedQuery, fields: Row[]) {
  // Candidate retrieval: any alternative of any token in any field.
  const or: Row[] = []
  for (const group of q.groups) {
    for (const alt of group) {
      for (const f of fields) or.push(wrap(f, alt))
    }
  }
  return or
}
// A field spec is a nested path like { title: true } / { department: { name: true } }.
function wrap(spec: Row, term: string): Row {
  const [key, val] = Object.entries(spec)[0]
  if (val === true) return { [key]: { contains: term, mode: "insensitive" } }
  return { [key]: wrap(val as Row, term) }
}

type Loader = (q: ParsedQuery, since: Date | null, openOnly: boolean, take: number) => Promise<Candidate[]>

const TAKE = 60

function where(q: ParsedQuery, fields: Row[], extra: Row = {}): Row {
  return q.tokens.length ? { ...extra, OR: tokenOr(q, fields) } : extra
}
const sinceFilter = (since: Date | null) => (since ? { createdAt: { gte: since } } : {})

const SPECS: Record<SearchKind, Loader> = {
  async job(q, since, openOnly, take) {
    const rows: Row[] = await prisma.job.findMany({
      where: where(
        q,
        [{ title: true }, { advertisementNo: true }, { location: true }, { education: true },
          { department: { name: true } }, { state: { name: true } }, { category: { name: true } }],
        {
          moderation: "APPROVED",
          ...sinceFilter(since),
          ...(openOnly ? { lastDate: { gte: new Date() } } : {}),
        }
      ),
      include: { department: { select: { name: true } }, state: { select: { name: true } }, category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take,
    })
    return rows.map((j) => {
      const state = j.status === "EXPIRED" ? "closed" : deadlineState(j.lastDate, j.startDate)
      const title = j.title
      return {
        title,
        secondary: [j.department?.name, j.state?.name, j.category?.name, j.location, j.advertisementNo, j.education].filter(Boolean).join(" "),
        body: [j.selectionProcess, j.howToApply, j.salary].filter(Boolean).join(" "),
        boost: 0,
        hit: {
          id: j.id, kind: "job", title, slug: j.slug, href: `/apply/${j.slug}`,
          subtitle: j.department?.name ?? null,
          location: j.location ?? j.state?.name ?? null,
          snippet: strip([j.education, j.ageLimit && `Age ${j.ageLimit}`].filter(Boolean).join(" · ")),
          date: j.createdAt.toISOString(),
          lastDate: j.lastDate?.toISOString() ?? null,
          state, vacancies: j.totalVacancies ?? null, salary: j.salary ?? null,
          status: j.status,
          actions: [
            ...(state === "closed" ? [] : act("apply", "Apply", `/apply/${j.slug}/start`, true)),
            ...act("pdf", "Notification", browse(j.officialNotification, `${title} – notification`)),
            ...act("website", "Official site", browse(j.officialWebsite ?? j.applyLink, `${title} – official site`)),
          ],
        },
      } as Candidate
    })
  },

  async private_job(q, since, openOnly, take) {
    const rows: Row[] = await prisma.privateJob.findMany({
      where: where(
        q,
        [{ title: true }, { location: true }, { category: true }, { qualification: true },
          { company: { name: true } }, { description: true }],
        {
          moderation: "APPROVED",
          status: "ACTIVE",
          ...sinceFilter(since),
          ...(openOnly ? { lastDate: { gte: new Date() } } : {}),
        }
      ),
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take,
    })
    return rows.map((j) => {
      const skills: string[] = j.skills ?? []
      const state = deadlineState(j.lastDate)
      return {
        title: j.title,
        secondary: [j.company?.name, j.location, j.category, j.qualification, ...skills].filter(Boolean).join(" "),
        body: j.description ?? "",
        boost: (j.isFresherFriendly ? 0.5 : 0) + Math.min(2, (j.trustScore ?? 0) / 50),
        hit: {
          id: j.id, kind: "private_job", title: j.title, slug: j.slug, href: `/private-jobs/${j.slug}`,
          subtitle: j.company?.name ?? null, location: j.location ?? null,
          snippet: strip(j.description),
          date: j.createdAt.toISOString(), lastDate: j.lastDate?.toISOString() ?? null,
          state, vacancies: j.vacancies ?? null, salary: j.salary ?? null, status: j.status,
          actions: [
            ...(state === "closed" ? [] : act("apply", "Apply", `/private-jobs/${j.slug}/apply`, true)),
            ...act("website", "Company site", browse(j.proofUrl, `${j.title} – posting`)),
          ],
        },
      } as Candidate
    })
  },

  result: docSpec("result", "/result", "result", "pdfUrl", "Result PDF"),
  admit_card: docSpec("admit_card", "/admit-card", "admitCard", "downloadUrl", "Admit card"),
  answer_key: docSpec("answer_key", "/answer-key", "answerKey", "pdfUrl", "Answer key PDF"),
  syllabus: docSpec("syllabus", "/syllabus", "syllabus", "pdfUrl", "Syllabus PDF"),

  async admission(q, since, openOnly, take) {
    const rows: Row[] = await prisma.admission.findMany({
      where: where(q, [{ title: true }, { description: true }, { department: { name: true } }, { category: { name: true } }], {
        moderation: "APPROVED",
        ...sinceFilter(since),
        ...(openOnly ? { lastDate: { gte: new Date() } } : {}),
      }),
      include: { department: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take,
    })
    return rows.map((a) => {
      const state = deadlineState(a.lastDate, a.startDate)
      return {
        title: a.title,
        secondary: a.department?.name ?? "",
        body: a.description ?? "",
        boost: 0,
        hit: {
          id: a.id, kind: "admission", title: a.title, slug: a.slug, href: `/admission/${a.slug}`,
          subtitle: a.department?.name ?? null, location: null, snippet: strip(a.description),
          date: a.createdAt.toISOString(), lastDate: a.lastDate?.toISOString() ?? null,
          state, vacancies: null, salary: null, status: a.status ?? null,
          actions: [
            ...(a.pdfUrl ? act("pdf", "Open notice", `/admission/${a.slug}/view`, true) : []),
          ],
        },
      } as Candidate
    })
  },

  async notification(q, since, _openOnly, take) {
    const rows: Row[] = await prisma.notification.findMany({
      where: where(q, [{ title: true }, { content: true }, { type: true }, { category: { name: true } }], sinceFilter(since)),
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take,
    })
    return rows.map((n) => {
      const link = browse(n.officialUrl, n.title)
      return {
        title: n.title,
        secondary: [n.category?.name, n.type].filter(Boolean).join(" "),
        body: n.content ?? "",
        boost: n.isTrending ? 3 : 0,
        hit: {
          id: n.id, kind: "notification", title: n.title, slug: n.slug,
          href: link ?? "/notifications",
          subtitle: n.category?.name ?? null, location: null, snippet: strip(n.content),
          date: n.createdAt.toISOString(), lastDate: null, state: null, vacancies: null, salary: null,
          status: n.type ?? null, trending: n.isTrending,
          actions: act("open", "Open notice", link, true),
        },
      } as Candidate
    })
  },

  async blog(q, since, _openOnly, take) {
    const rows: Row[] = await prisma.blogPost.findMany({
      where: where(q, [{ title: true }, { excerpt: true }, { tags: true }, { category: { name: true } }], {
        published: true, moderation: "APPROVED", ...sinceFilter(since),
      }),
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take,
    })
    return rows.map((b) => ({
      title: b.title,
      secondary: [b.category?.name, b.tags].filter(Boolean).join(" "),
      body: b.excerpt ?? "",
      boost: Math.min(2, (b.views ?? 0) / 2000),
      hit: {
        id: b.id, kind: "blog", title: b.title, slug: b.slug, href: `/blog/${b.slug}`,
        subtitle: b.category?.name ?? null, location: null, snippet: strip(b.excerpt),
        date: b.createdAt.toISOString(), lastDate: null, state: null, vacancies: null, salary: null,
        status: null, actions: act("open", "Read", `/blog/${b.slug}`, true),
      },
    }) as Candidate)
  },
}

function docSpec(
  kind: SearchKind,
  base: string,
  model: "result" | "admitCard" | "answerKey" | "syllabus",
  urlField: string,
  pdfLabel: string
): Loader {
  return async (q, since, _openOnly, take) => {
    {
      const delegate = (prisma as unknown as Record<string, { findMany: (a: unknown) => Promise<Row[]> }>)[model]
      const rows = await delegate.findMany({
        where: where(q, [{ title: true }, { description: true }, { department: { name: true } }, { category: { name: true } }], {
          moderation: "APPROVED",
          ...sinceFilter(since),
        }),
        include: { department: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take,
      })
      return rows.map((r) => {
        const hasFile = !!normalizeExternalUrl(r[urlField])
        return {
          title: r.title,
          secondary: r.department?.name ?? "",
          body: r.description ?? "",
          boost: 0,
          hit: {
            id: r.id, kind, title: r.title, slug: r.slug, href: `${base}/${r.slug}`,
            subtitle: r.department?.name ?? null, location: null, snippet: strip(r.description),
            date: r.createdAt.toISOString(), lastDate: null, state: null, vacancies: null, salary: null,
            status: r.status ?? null,
            actions: hasFile ? act("pdf", pdfLabel, `${base}/${r.slug}/view`, true) : [],
          },
        } as Candidate
      })
    }
  }
}

/* ───────────────────────── typo tolerance ────────────────────────────── */

let vocab: { at: number; words: Set<string> } | null = null

async function getVocabulary(): Promise<Set<string>> {
  if (vocab && Date.now() - vocab.at < 10 * 60_000) return vocab.words
  const words = new Set<string>()
  const add = (t: string) => {
    for (const w of t.toLowerCase().split(/[^\p{L}\p{N}]+/u)) if (w.length > 2) words.add(w)
  }
  const [jobs, pj, dept, terms] = await Promise.all([
    prisma.job.findMany({ select: { title: true }, orderBy: { createdAt: "desc" }, take: 400 }),
    prisma.privateJob.findMany({ select: { title: true }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.department.findMany({ select: { name: true }, take: 300 }),
    prisma.searchQuery.findMany({ where: { resultCount: { gt: 0 } }, select: { term: true }, orderBy: { createdAt: "desc" }, take: 300 }).catch(() => [] as { term: string }[]),
  ])
  jobs.forEach((j) => add(j.title))
  pj.forEach((j) => add(j.title))
  dept.forEach((d) => add(d.name))
  terms.forEach((t) => add(t.term))
  Object.keys(SYNONYMS).forEach(add)
  vocab = { at: Date.now(), words }
  return words
}

function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      rowMin = Math.min(rowMin, cur[j])
    }
    if (rowMin > max) return max + 1
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j]
    cur = []
  }
  return prev[b.length]
}

async function didYouMean(q: ParsedQuery): Promise<string | null> {
  if (!q.tokens.length) return null
  const words = await getVocabulary()
  let changed = false
  const fixed = q.tokens.map((t) => {
    if (t.length < 4 || words.has(t) || /\d/.test(t)) return t
    const max = t.length > 6 ? 2 : 1
    let best = t
    let bestD = max + 1
    for (const w of words) {
      const d = editDistance(t, w, max)
      if (d < bestD) { bestD = d; best = w; if (d === 1) break }
    }
    if (best !== t) changed = true
    return best
  })
  return changed ? fixed.join(" ") : null
}

/* ───────────────────────────── public API ────────────────────────────── */

export interface SearchOptions {
  q: string
  kind?: SearchKind | null
  sort?: SearchSort
  withinDays?: number
  openOnly?: boolean
  page?: number
  pageSize?: number
}

export async function runSearch(opts: SearchOptions): Promise<SearchResponse> {
  const started = Date.now()
  const parsed = parseQuery(opts.q)
  const kindFilter = opts.kind ?? parsed.kind
  const sort = opts.sort ?? "relevance"
  const page = Math.max(1, opts.page ?? 1)
  const pageSize = Math.min(30, Math.max(1, opts.pageSize ?? 12))
  const since = opts.withinDays ? new Date(Date.now() - opts.withinDays * 86_400_000) : null
  const openOnly = opts.openOnly || parsed.openOnly

  const execute = async (q: ParsedQuery, relaxed: boolean) => {
    const settled = await Promise.all(
      SEARCH_KINDS.map(async (k) => {
        try {
          const cands = await SPECS[k](q, since, openOnly, TAKE)
          const need = relaxed || q.tokens.length <= 1 ? Math.min(1, q.tokens.length)
            : q.tokens.length === 2 ? 2 : Math.ceil(q.tokens.length * 0.6)
          const hits: SearchHit[] = []
          for (const c of cands) {
            const { score, matched } = scoreCandidate(c, q)
            if (q.tokens.length && matched < need) continue
            hits.push({ ...c.hit, score: Math.round(score * 10) / 10 })
          }
          return [k, hits] as const
        } catch {
          return [k, [] as SearchHit[]] as const // one failing model must not break search
        }
      })
    )
    return Object.fromEntries(settled) as Record<SearchKind, SearchHit[]>
  }

  let byKind = await execute(parsed, false)
  let total = SEARCH_KINDS.reduce((n, k) => n + byKind[k].length, 0)
  let usedQuery = parsed
  let suggestion: string | null = null

  if (total === 0 && parsed.tokens.length) {
    suggestion = await didYouMean(parsed).catch(() => null)
    if (suggestion) {
      const fixed = parseQuery(suggestion)
      byKind = await execute(fixed, false)
      total = SEARCH_KINDS.reduce((n, k) => n + byKind[k].length, 0)
      if (total) usedQuery = fixed
      else suggestion = null
    }
    if (total === 0 && parsed.tokens.length > 1) {
      byKind = await execute(parsed, true) // relaxed: any token
      total = SEARCH_KINDS.reduce((n, k) => n + byKind[k].length, 0)
    }
  }

  const facets = Object.fromEntries(SEARCH_KINDS.map((k) => [k, byKind[k].length])) as Record<SearchKind, number>
  let pool = SEARCH_KINDS.filter((k) => !kindFilter || k === kindFilter).flatMap((k) => byKind[k])

  const byDate = (a: SearchHit, b: SearchHit) => +new Date(b.date) - +new Date(a.date)
  if (sort === "latest") pool.sort(byDate)
  else if (sort === "deadline") {
    const t = (h: SearchHit) => (h.lastDate && h.state !== "closed" ? +new Date(h.lastDate) : Infinity)
    pool.sort((a, b) => t(a) - t(b) || b.score - a.score)
  } else pool.sort((a, b) => b.score - a.score || byDate(a, b))

  // Empty query = "discover" feed: interleave kinds so the page is not one-type.
  if (!parsed.tokens.length && !kindFilter && sort === "relevance") {
    const lanes = SEARCH_KINDS.map((k) => byKind[k].slice().sort(byDate))
    pool = []
    for (let i = 0; lanes.some((l) => i < l.length); i++) for (const l of lanes) if (l[i]) pool.push(l[i])
  }

  const start = (page - 1) * pageSize
  const hits = pool.slice(start, start + pageSize)

  if (parsed.raw && page === 1) {
    prisma.searchQuery
      .create({ data: { term: parsed.raw.toLowerCase().slice(0, 200), resultCount: pool.length } })
      .catch(() => null)
  }

  return {
    success: true,
    query: parsed.raw,
    tokens: usedQuery.tokens,
    suggestion,
    total: pool.length,
    page,
    pageSize,
    hasMore: start + pageSize < pool.length,
    facets,
    hits,
    tookMs: Date.now() - started,
  }
}

/** Trending + recent popular terms for the empty state. */
export async function trendingTerms(limit = 10): Promise<string[]> {
  try {
    const since = new Date(Date.now() - 14 * 86_400_000)
    const rows = await prisma.searchQuery.groupBy({
      by: ["term"],
      where: { createdAt: { gte: since }, resultCount: { gt: 0 } },
      _count: { term: true },
      orderBy: { _count: { term: "desc" } },
      take: limit,
    })
    return rows.map((r) => r.term).filter((t) => t.length > 2)
  } catch {
    return []
  }
}
