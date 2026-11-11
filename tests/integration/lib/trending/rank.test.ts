/**
 * Integration test: trending/rank.ts + trending/queries.ts + trending/score.ts
 * run together against an in-memory fake of the Prisma models they read.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

type Row = Record<string, unknown>
const db = vi.hoisted(() => ({
  pageViews: [] as Row[],
  jobViews: [] as Row[],
  privateJobViews: [] as Row[],
  bookmarks: [] as Row[],
  outbound: [] as Row[],
  jobClicks: [] as Row[],
  blogPosts: [] as Row[],
  jobs: [] as Row[],
  results: [] as Row[],
  failAnalytics: false,
}))

const prismaMock = vi.hoisted(() => {
  const since = (args: { where?: { createdAt?: { gte: Date }; date?: { gte: Date } } }) =>
    (args.where?.createdAt?.gte ?? args.where?.date?.gte ?? new Date(0)).getTime()
  const inWindow = (r: Row, from: number) => new Date((r.createdAt ?? r.date) as Date).getTime() >= from
  const count = (rows: Row[], key: string) => {
    const m = new Map<string, number>()
    for (const r of rows) if (r[key]) m.set(r[key] as string, (m.get(r[key] as string) ?? 0) + 1)
    return [...m].map(([id, n]) => ({ [key]: id, _count: { _all: n } }))
  }
  const guard = <T,>(fn: () => T) => {
    if (db.failAnalytics) throw new Error("analytics db down")
    return fn()
  }
  return {
    pageViewEvent: {
      groupBy: vi.fn(async (a) =>
        guard(() => {
          const rows = db.pageViews.filter((r) => inWindow(r, since(a)))
          const m = new Map<string, Row>()
          for (const r of rows) {
            const k = `${r.entityType}:${r.entityId}`
            const e = m.get(k) ?? { entityType: r.entityType, entityId: r.entityId, _count: { _all: 0 } }
            ;(e._count as { _all: number })._all++
            m.set(k, e)
          }
          return [...m.values()]
        }),
      ),
    },
    jobView: {
      groupBy: vi.fn(async (a) => guard(() => db.jobViews.filter((r) => inWindow(r, since(a))).map((r) => ({ jobId: r.jobId, _sum: { views: r.views } })))),
    },
    privateJobView: {
      groupBy: vi.fn(async (a) =>
        guard(() => db.privateJobViews.filter((r) => inWindow(r, since(a))).map((r) => ({ privateJobId: r.privateJobId, _sum: { views: r.views } }))),
      ),
    },
    bookmark: {
      groupBy: vi.fn(async (a: { by: string[] }) => guard(() => count(db.bookmarks.filter((r) => inWindow(r, since(a as never))), a.by[0]))),
    },
    outboundClick: { groupBy: vi.fn(async (a) => guard(() => count(db.outbound.filter((r) => inWindow(r, since(a))), "jobId"))) },
    jobClick: { groupBy: vi.fn(async (a) => guard(() => count(db.jobClicks.filter((r) => inWindow(r, since(a))), "privateJobId"))) },
    blogPost: {
      findMany: vi.fn(async (a: { select?: unknown }) => (a.select ? guard(() => db.blogPosts.map((p) => ({ id: p.id, views: p.views }))) : db.blogPosts)),
    },
    job: { findMany: vi.fn(async () => db.jobs) },
    result: { findMany: vi.fn(async () => db.results) },
    admitCard: { findMany: vi.fn(async () => []) },
    answerKey: { findMany: vi.fn(async () => []) },
    syllabus: { findMany: vi.fn(async () => []) },
    admission: { findMany: vi.fn(async () => []) },
    privateJob: { findMany: vi.fn(async () => []) },
  }
})
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

import { getTrending, getTrendingOverview, loadSharedSignals, rankCandidateList, rankItems } from "@/lib/trending/rank"
import { windowStart } from "@/lib/trending/queries"

const DAY = 86_400_000
const ago = (days: number) => new Date(Date.now() - days * DAY)
const job = (id: string, createdDaysAgo: number, extra: Row = {}) => ({ id, createdAt: ago(createdDaysAgo), status: "ACTIVE", ...extra })

beforeEach(() => {
  for (const key of Object.keys(db) as (keyof typeof db)[]) {
    if (Array.isArray(db[key])) (db[key] as Row[]).length = 0
  }
  db.failAnalytics = false
})

describe("windowStart", () => {
  it("subtracts whole days", () => {
    const now = new Date("2026-01-10T00:00:00Z")
    expect(windowStart(7, now).toISOString()).toBe("2026-01-03T00:00:00.000Z")
  })
})

describe("loadSharedSignals", () => {
  it("collects page views per type and id", async () => {
    db.pageViews.push({ entityType: "JOB", entityId: "j1", createdAt: ago(1) }, { entityType: "JOB", entityId: "j1", createdAt: ago(2) })
    db.blogPosts.push({ id: "b1", views: 42 })
    const s = await loadSharedSignals(windowStart(7))
    expect(s.pv.get("JOB")?.get("j1")).toBe(2)
    expect(s.blogViews.get("b1")).toBe(42)
  })

  it("returns empty maps when analytics tables fail", async () => {
    db.failAnalytics = true
    const s = await loadSharedSignals(windowStart(7))
    expect(s.pv.size).toBe(0)
    expect(s.bookmarks.job.size).toBe(0)
    expect(s.jobViews.size).toBe(0)
    expect(s.blogViews.size).toBe(0)
  })
})

describe("rankItems", () => {
  it("ranks engaged jobs above fresh but unseen ones", async () => {
    db.pageViews.push(...Array.from({ length: 50 }, () => ({ entityType: "JOB", entityId: "old", createdAt: ago(1) })))
    db.bookmarks.push({ jobId: "old", createdAt: ago(1) })
    db.outbound.push({ jobId: "old", createdAt: ago(1) })
    const signals = await loadSharedSignals(windowStart(7))
    const { ranked, cold } = rankItems("jobs", [job("new", 0), job("old", 20)], signals)
    expect(cold).toBe(false)
    expect(ranked.map((r) => r.item.id)).toEqual(["old", "new"])
    expect(ranked[0].views).toBe(50)
  })

  it("penalises expired jobs and breaks ties by recency", async () => {
    const signals = await loadSharedSignals(windowStart(7))
    const { ranked, cold } = rankItems("jobs", [job("expired", 0, { status: "EXPIRED" }), job("a", 1), job("b", 1)], signals)
    expect(cold).toBe(true)
    expect(ranked.at(-1)?.item.id).toBe("expired")
  })

  it("scores each module type without throwing", async () => {
    const signals = await loadSharedSignals(windowStart(7))
    const item = { id: "x", createdAt: ago(1), resultDate: ago(1).toISOString(), examDate: ago(2), lastDate: ago(-3), trustScore: 80, status: "ACTIVE" }
    for (const m of ["results", "admit-cards", "answer-keys", "syllabus", "admissions", "private-jobs", "blog"] as const) {
      const { ranked } = rankItems(m, [item], signals)
      expect(Number.isFinite(ranked[0].score)).toBe(true)
    }
  })
})

describe("getTrending", () => {
  it("returns an empty fallback when there are no candidates", async () => {
    const r = await getTrending("jobs")
    expect(r).toMatchObject({ items: [], fallback: true, windowDays: 7 })
  })

  it("uses the 7-day window when there is recent engagement", async () => {
    db.jobs.push(job("a", 3), job("b", 1))
    db.jobViews.push({ jobId: "a", views: 30, date: ago(1) })
    const r = await getTrending("jobs", 1)
    expect(r.fallback).toBe(false)
    expect(r.windowDays).toBe(7)
    expect(r.items.map((i) => i.id)).toEqual(["a"])
    expect(r.views.a).toBe(30)
    expect(typeof r.scores.a).toBe("number")
  })

  it("widens to 30 days, then falls back to recency", async () => {
    db.jobs.push(job("a", 25), job("b", 2))
    db.bookmarks.push({ jobId: "a", createdAt: ago(20) })
    const widened = await getTrending("jobs")
    expect(widened).toMatchObject({ fallback: false, windowDays: 30 })
    expect(widened.items[0].id).toBe("a")

    db.bookmarks.length = 0
    const recency = await getTrending("jobs")
    expect(recency).toMatchObject({ fallback: true, windowDays: 30 })
    expect(recency.items.map((i) => i.id)).toEqual(["b", "a"])
  })
})

describe("rankCandidateList", () => {
  it("handles empty, 7-day, 30-day and cold lists", async () => {
    expect(await rankCandidateList("results", [])).toEqual({ ranked: [], fallback: true, windowDays: 7 })

    const items = [job("r1", 5), job("r2", 1)]
    db.bookmarks.push({ resultId: "r1", createdAt: ago(1) })
    expect((await rankCandidateList("results", items)).windowDays).toBe(7)

    db.bookmarks[0].createdAt = ago(15)
    expect((await rankCandidateList("results", items)).windowDays).toBe(30)

    db.bookmarks.length = 0
    const cold = await rankCandidateList("results", items)
    expect(cold.fallback).toBe(true)
    expect(cold.ranked.map((r) => r.item.id)).toEqual(["r2", "r1"])
  })
})

describe("getTrendingOverview", () => {
  it("scores every module from one signal batch", async () => {
    db.jobs.push(job("a", 1))
    db.pageViews.push({ entityType: "JOB", entityId: "a", createdAt: ago(1) })
    db.results.push(job("r", 2))
    const o = await getTrendingOverview(3)
    expect(o.jobs.fallback).toBe(false)
    expect(o.results.fallback).toBe(true)
    expect(o.blog.items).toEqual([])
    expect(typeof o.scoredAt).toBe("string")
  })

  it("widens the window site-wide on a cold start", async () => {
    db.jobs.push(job("a", 20))
    db.pageViews.push({ entityType: "JOB", entityId: "a", createdAt: ago(20) })
    const o = await getTrendingOverview()
    expect(o.jobs.windowDays).toBe(30)
    expect(o.jobs.fallback).toBe(false)
  })
})
