/**
 * Per-module trending ranking.
 * Pipeline per module: fetch APPROVED candidates (recency pool) -> attach
 * windowed engagement (7d, widened to 30d when cold) -> score -> sort.
 * When no engagement exists at all, candidates keep recency order and the
 * result is flagged `fallback: true` so the UI can hide counts/badges.
 */

import { prisma } from "@/lib/prisma"
import {
  CANDIDATE_POOL_SIZE,
  ENTITY_TYPE,
  FALLBACK_WINDOW_DAYS,
  MODULE_SCORING,
  TRENDING_WINDOW_DAYS,
  type TrendingModule,
} from "./config"
import { engagementScore, freshnessTerm, isCold, staleTerm, urgencyTerm, viewTerm } from "./score"
import {
  blogViewsAllTime,
  bookmarkMaps,
  jobViewSums,
  outboundClickCounts,
  pageViewCounts,
  privateJobClickCounts,
  privateJobViewSums,
  windowStart,
  type BookmarkMaps,
} from "./queries"

/** Minimal structural shape every rankable row satisfies. */
export type AnyItem = { id: string; createdAt: Date } & { [key: string]: unknown }

export interface Ranked<T> {
  item: T
  score: number
  views: number
}

export interface TrendResult<T> {
  items: T[]
  /** item.id -> score, for badges/debugging */
  scores: Record<string, number>
  /** item.id -> windowed human views (0 when cold) */
  views: Record<string, number>
  /** true when engagement was cold and recency order was kept */
  fallback: boolean
  windowDays: number
  scoredAt: string
}

interface SharedSignals {
  pv: Map<string, Map<string, number>>
  bookmarks: BookmarkMaps
  jobViews: Map<string, number>
  privateJobViews: Map<string, number>
  outboundClicks: Map<string, number>
  privateClicks: Map<string, number>
  blogViews: Map<string, number>
}

const asDate = (v: unknown): Date | null => {
  if (v instanceof Date) return v
  if (typeof v === "string") {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

const fieldDate = (item: AnyItem, key: string): Date | null => asDate(item[key])
const fieldInt = (item: AnyItem, key: string): number => {
  const v = item[key]
  return typeof v === "number" && Number.isFinite(v) ? v : 0
}
const fieldStr = (item: AnyItem, key: string): string | null =>
  typeof item[key] === "string" ? (item[key] as string) : null

/** Load every signal map in one batch (single-module callers reuse it too). */
export async function loadSharedSignals(since: Date): Promise<SharedSignals> {
  const types = Object.values(ENTITY_TYPE)
  const [pvRaw, bm, jv, pjv, oc, pc, bv] = await Promise.all([
    pageViewCounts(types, since),
    bookmarkMaps(since),
    jobViewSums(since),
    privateJobViewSums(since),
    outboundClickCounts(since),
    privateJobClickCounts(since),
    blogViewsAllTime(),
  ])
  const pv = new Map<string, Map<string, number>>()
  for (const [compound, count] of pvRaw) {
    const sep = compound.indexOf(":")
    if (sep < 0) continue
    const type = compound.slice(0, sep)
    const id = compound.slice(sep + 1)
    let inner = pv.get(type)
    if (!inner) {
      inner = new Map<string, number>()
      pv.set(type, inner)
    }
    inner.set(id, count)
  }
  return { pv, bookmarks: bm, jobViews: jv, privateJobViews: pjv, outboundClicks: oc, privateClicks: pc, blogViews: bv }
}

const pvOf = (s: SharedSignals, type: string, id: string): number => s.pv.get(type)?.get(id) ?? 0

function scoreOne(module: Exclude<TrendingModule, "exams">, item: AnyItem, s: SharedSignals, nowMs: number): { score: number; views: number } {
  const cfg = MODULE_SCORING[module]
  const type = ENTITY_TYPE[module]
  const pv = pvOf(s, type, item.id)
  let views = pv
  let bm = 0
  let clicks = 0
  let extra = 0
  let keyDate: Date | null = item.createdAt
  let urgencyDate: Date | null = null
  let staleDate: Date | null = null
  let statusAdj = 0

  switch (module) {
    case "jobs": {
      views += s.jobViews.get(item.id) ?? 0
      bm = s.bookmarks.job.get(item.id) ?? 0
      clicks = s.outboundClicks.get(item.id) ?? 0
      extra = cfg.vacancyWeight * viewTerm(fieldInt(item, "totalVacancies"))
      urgencyDate = fieldDate(item, "lastDate")
      if (fieldStr(item, "status") !== "ACTIVE") statusAdj = -3
      break
    }
    case "results": {
      bm = s.bookmarks.result.get(item.id) ?? 0
      keyDate = fieldDate(item, "resultDate") ?? item.createdAt
      urgencyDate = fieldDate(item, "resultDate")
      staleDate = null
      break
    }
    case "admit-cards": {
      bm = s.bookmarks.admitCard.get(item.id) ?? 0
      keyDate = fieldDate(item, "examDate") ?? item.createdAt
      urgencyDate = fieldDate(item, "examDate")
      staleDate = fieldDate(item, "examDate")
      break
    }
    case "answer-keys":
      break
    case "syllabus": {
      bm = s.bookmarks.syllabus.get(item.id) ?? 0
      break
    }
    case "admissions": {
      urgencyDate = fieldDate(item, "lastDate")
      staleDate = fieldDate(item, "lastDate")
      break
    }
    case "private-jobs": {
      views += s.privateJobViews.get(item.id) ?? 0
      bm = s.bookmarks.privateJob.get(item.id) ?? 0
      clicks = s.privateClicks.get(item.id) ?? 0
      extra = cfg.trustWeight * (fieldInt(item, "trustScore") / 100)
      urgencyDate = fieldDate(item, "lastDate")
      if (fieldStr(item, "status") !== "ACTIVE") statusAdj = -3
      break
    }
    case "blog": {
      extra = 0.5 * viewTerm(s.blogViews.get(item.id) ?? 0)
      break
    }
  }

  const score =
    engagementScore({ views, bookmarks: bm, clicks }, cfg.viewsWeight, cfg.bookmarkWeight, cfg.clickWeight) +
    cfg.freshnessWeight * freshnessTerm(nowMs, keyDate, cfg.halfLifeDays) +
    urgencyTerm(nowMs, urgencyDate, cfg.urgencyWindowDays, cfg.urgencyWeight) +
    staleTerm(staleDate, nowMs, cfg.stalePenalty) +
    extra +
    statusAdj
  return { score, views }
}

/** Score + sort candidates. Returns ranked list and whether engagement was cold. */
export function rankItems<T extends AnyItem>(
  module: Exclude<TrendingModule, "exams">,
  candidates: T[],
  signals: SharedSignals,
  nowMs = Date.now()
): { ranked: Array<Ranked<T>>; cold: boolean } {
  const scored = candidates.map((item) => ({ item, ...scoreOne(module, item, signals, nowMs) }))
  // Cold = no windowed engagement on any signal kind (views, bookmarks, clicks).
  const type = ENTITY_TYPE[module]
  const honestCold = isCold(
    candidates.map((item) => {
      const id = item.id
      let views = pvOf(signals, type, id)
      let bm = 0
      let clicks = 0
      if (module === "jobs") {
        views += signals.jobViews.get(id) ?? 0
        bm = signals.bookmarks.job.get(id) ?? 0
        clicks = signals.outboundClicks.get(id) ?? 0
      } else if (module === "results") bm = signals.bookmarks.result.get(id) ?? 0
      else if (module === "admit-cards") bm = signals.bookmarks.admitCard.get(id) ?? 0
      else if (module === "syllabus") bm = signals.bookmarks.syllabus.get(id) ?? 0
      else if (module === "private-jobs") {
        views += signals.privateJobViews.get(id) ?? 0
        bm = signals.bookmarks.privateJob.get(id) ?? 0
        clicks = signals.privateClicks.get(id) ?? 0
      }
      return { views, bookmarks: bm, clicks }
    })
  )
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.item.createdAt.getTime() - a.item.createdAt.getTime()
  })
  return { ranked: scored, cold: honestCold }
}

type Module = Exclude<TrendingModule, "exams">

const CANDIDATE_INCLUDE = { department: true, category: true } as const

/** Recency pool per module (APPROVED only) - includes mirror the public list APIs. */
async function fetchCandidates(module: Module, poolSize: number): Promise<AnyItem[]> {
  switch (module) {
    case "jobs":
      return (await prisma.job.findMany({
        where: { moderation: "APPROVED" },
        include: { ...CANDIDATE_INCLUDE, state: true },
        orderBy: { createdAt: "desc" },
        take: poolSize,
      })) as unknown as AnyItem[]
    case "results":
      return (await prisma.result.findMany({
        where: { moderation: "APPROVED" },
        include: { ...CANDIDATE_INCLUDE, job: true },
        orderBy: [{ resultDate: "desc" }, { createdAt: "desc" }],
        take: poolSize,
      })) as unknown as AnyItem[]
    case "admit-cards":
      return (await prisma.admitCard.findMany({
        where: { moderation: "APPROVED" },
        include: { ...CANDIDATE_INCLUDE, job: true },
        orderBy: { createdAt: "desc" },
        take: poolSize,
      })) as unknown as AnyItem[]
    case "answer-keys":
      return (await prisma.answerKey.findMany({
        where: { moderation: "APPROVED" },
        include: { ...CANDIDATE_INCLUDE, job: true },
        orderBy: { createdAt: "desc" },
        take: poolSize,
      })) as unknown as AnyItem[]
    case "syllabus":
      return (await prisma.syllabus.findMany({
        where: { moderation: "APPROVED" },
        include: { ...CANDIDATE_INCLUDE, job: true },
        orderBy: { createdAt: "desc" },
        take: poolSize,
      })) as unknown as AnyItem[]
    case "admissions":
      return (await prisma.admission.findMany({
        where: { moderation: "APPROVED" },
        include: { ...CANDIDATE_INCLUDE },
        orderBy: { createdAt: "desc" },
        take: poolSize,
      })) as unknown as AnyItem[]
    case "private-jobs":
      return (await prisma.privateJob.findMany({
        where: { moderation: "APPROVED" },
        include: { company: true },
        orderBy: { createdAt: "desc" },
        take: poolSize,
      })) as unknown as AnyItem[]
    case "blog":
      return (await prisma.blogPost.findMany({
        where: { published: true, moderation: "APPROVED" },
        include: { category: true },
        orderBy: { createdAt: "desc" },
        take: poolSize,
      })) as unknown as AnyItem[]
  }
}

function toResult<T extends AnyItem>(ranked: Array<Ranked<T>>, limit: number, fallback: boolean, windowDays: number): TrendResult<T> {
  const top = ranked.slice(0, limit)
  const scores: Record<string, number> = {}
  const views: Record<string, number> = {}
  for (const r of top) {
    scores[r.item.id] = Math.round(r.score * 100) / 100
    views[r.item.id] = r.views
  }
  return { items: top.map((r) => r.item), scores, views, fallback, windowDays, scoredAt: new Date().toISOString() }
}

/** Rank one module end-to-end: 7d window, 30d widening, then recency fallback. */
export async function getTrending<T extends AnyItem = AnyItem>(
  module: Module,
  limit = 8,
  poolSize = CANDIDATE_POOL_SIZE
): Promise<TrendResult<T>> {
  const [candidates, signals7] = await Promise.all([
    fetchCandidates(module, poolSize) as Promise<T[]>,
    loadSharedSignals(windowStart(TRENDING_WINDOW_DAYS)),
  ])
  if (candidates.length === 0) {
    return { items: [], scores: {}, views: {}, fallback: true, windowDays: TRENDING_WINDOW_DAYS, scoredAt: new Date().toISOString() }
  }
  const { ranked, cold } = rankItems(module, candidates, signals7)
  const windowDays = TRENDING_WINDOW_DAYS
  if (cold) {
    const signals30 = await loadSharedSignals(windowStart(FALLBACK_WINDOW_DAYS))
    const retry = rankItems(module, candidates, signals30)
    if (!retry.cold) return toResult(retry.ranked, limit, false, FALLBACK_WINDOW_DAYS)
    // Still cold: keep recency order of the pool.
    const recency = [...candidates].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    return toResult(
      recency.map((item) => ({ item, score: 0, views: 0 })),
      limit,
      true,
      FALLBACK_WINDOW_DAYS
    )
  }
  return toResult(ranked, limit, false, windowDays)
}

/** Rank an already-fetched candidate list (used by list APIs for sort=trending). */
export async function rankCandidateList<T extends AnyItem>(module: Module, candidates: T[]): Promise<{ ranked: Array<Ranked<T>>; fallback: boolean; windowDays: number }> {
  if (candidates.length === 0) return { ranked: [], fallback: true, windowDays: TRENDING_WINDOW_DAYS }
  const signals7 = await loadSharedSignals(windowStart(TRENDING_WINDOW_DAYS))
  const first = rankItems(module, candidates, signals7)
  if (!first.cold) return { ranked: first.ranked, fallback: false, windowDays: TRENDING_WINDOW_DAYS }
  const signals30 = await loadSharedSignals(windowStart(FALLBACK_WINDOW_DAYS))
  const retry = rankItems(module, candidates, signals30)
  if (!retry.cold) return { ranked: retry.ranked, fallback: false, windowDays: FALLBACK_WINDOW_DAYS }
  return {
    ranked: [...candidates]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((item) => ({ item, score: 0, views: 0 })),
    fallback: true,
    windowDays: FALLBACK_WINDOW_DAYS,
  }
}

/** Trending overview for the home strip - all modules scored from one signal batch. */
export async function getTrendingOverview(limitPerModule = 6): Promise<Record<Module, TrendResult<AnyItem>> & { scoredAt: string }> {
  const modules: Module[] = ["jobs", "results", "admit-cards", "answer-keys", "syllabus", "admissions", "private-jobs", "blog"]
  const [pool, signals7] = await Promise.all([
    Promise.all(modules.map((m) => fetchCandidates(m, CANDIDATE_POOL_SIZE))),
    loadSharedSignals(windowStart(TRENDING_WINDOW_DAYS)),
  ])
  let signals = signals7
  let windowDays = TRENDING_WINDOW_DAYS
  const firstPass = pool.map((candidates, i) => rankItems(modules[i], candidates, signals))
  if (firstPass.every((p) => p.cold)) {
    // Site-wide cold start: widen once for every module.
    signals = await loadSharedSignals(windowStart(FALLBACK_WINDOW_DAYS))
    windowDays = FALLBACK_WINDOW_DAYS
  }
  const out: Record<string, TrendResult<AnyItem>> = {}
  modules.forEach((m, i) => {
    const pass = windowDays === TRENDING_WINDOW_DAYS ? firstPass[i] : rankItems(m, pool[i], signals)
    if (pass.cold) {
      const recency = [...pool[i]].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      out[m] = toResult(
        recency.map((item) => ({ item, score: 0, views: 0 })),
        limitPerModule,
        true,
        windowDays
      )
    } else {
      out[m] = toResult(pass.ranked, limitPerModule, false, windowDays)
    }
  })
  void signals
  return { ...(out as Record<Module, TrendResult<AnyItem>>), scoredAt: new Date().toISOString() }
}
