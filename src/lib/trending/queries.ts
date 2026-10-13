/**
 * Windowed engagement aggregations feeding the trending scorer.
 * All counts are bot-filtered (PageViewEvent.userAgentClass = human).
 * Bookmarks/clicks/views-log tables carry createdAt/date so windows apply.
 */

import { prisma } from "@/lib/prisma"

export function windowStart(days: number, now = new Date()): Date {
  return new Date(now.getTime() - days * 86_400_000)
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0)

/**
 * Human page-view counts per entity, keyed `${entityType}:${entityId}`.
 * EntityViewTracker writes entityType/entityId on every detail page.
 */
export async function pageViewCounts(entityTypes: string[], since: Date): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (entityTypes.length === 0) return map
  try {
    const rows = await prisma.pageViewEvent.groupBy({
      by: ["entityType", "entityId"],
      where: {
        entityType: { in: entityTypes },
        entityId: { not: null },
        createdAt: { gte: since },
        userAgentClass: "human",
      },
      _count: { _all: true },
    })
    for (const r of rows) {
      if (r.entityType && r.entityId) map.set(`${r.entityType}:${r.entityId}`, r._count._all)
    }
  } catch {
    /* analytics must never break ranking - cold fallback covers it */
  }
  return map
}

/** Daily JobView sums in window, keyed by jobId. */
export async function jobViewSums(since: Date): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  try {
    const rows = await prisma.jobView.groupBy({
      by: ["jobId"],
      where: { date: { gte: since } },
      _sum: { views: true },
    })
    for (const r of rows) map.set(r.jobId, num(r._sum.views))
  } catch {
    /* ignore */
  }
  return map
}

/** Daily PrivateJobView sums in window, keyed by privateJobId. */
export async function privateJobViewSums(since: Date): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  try {
    const rows = await prisma.privateJobView.groupBy({
      by: ["privateJobId"],
      where: { date: { gte: since } },
      _sum: { views: true },
    })
    for (const r of rows) map.set(r.privateJobId, num(r._sum.views))
  } catch {
    /* ignore */
  }
  return map
}

export interface BookmarkMaps {
  job: Map<string, number>
  result: Map<string, number>
  admitCard: Map<string, number>
  privateJob: Map<string, number>
  syllabus: Map<string, number>
}

/** Windowed bookmark counts per content id (AnswerKey/Admission/Blog have no bookmark FK). */
export async function bookmarkMaps(since: Date): Promise<BookmarkMaps> {
  const empty = (): BookmarkMaps => ({
    job: new Map(),
    result: new Map(),
    admitCard: new Map(),
    privateJob: new Map(),
    syllabus: new Map(),
  })
  try {
    const [jobs, results, admits, privates, syllabi] = await Promise.all([
      prisma.bookmark.groupBy({ by: ["jobId"], where: { jobId: { not: null }, createdAt: { gte: since } }, _count: { _all: true } }),
      prisma.bookmark.groupBy({ by: ["resultId"], where: { resultId: { not: null }, createdAt: { gte: since } }, _count: { _all: true } }),
      prisma.bookmark.groupBy({ by: ["admitCardId"], where: { admitCardId: { not: null }, createdAt: { gte: since } }, _count: { _all: true } }),
      prisma.bookmark.groupBy({ by: ["privateJobId"], where: { privateJobId: { not: null }, createdAt: { gte: since } }, _count: { _all: true } }),
      prisma.bookmark.groupBy({ by: ["syllabusId"], where: { syllabusId: { not: null }, createdAt: { gte: since } }, _count: { _all: true } }),
    ])
    const toMap = <K extends string>(rows: Array<Record<K, string | null> & { _count: { _all: number } }>, key: K) => {
      const m = new Map<string, number>()
      for (const r of rows) {
        const id = r[key]
        if (id) m.set(id, r._count._all)
      }
      return m
    }
    return {
      job: toMap(jobs, "jobId"),
      result: toMap(results, "resultId"),
      admitCard: toMap(admits, "admitCardId"),
      privateJob: toMap(privates, "privateJobId"),
      syllabus: toMap(syllabi, "syllabusId"),
    }
  } catch {
    return empty()
  }
}

/** Gov-job outbound clicks (apply links) in window, keyed by jobId. */
export async function outboundClickCounts(since: Date): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  try {
    const rows = await prisma.outboundClick.groupBy({
      by: ["jobId"],
      where: { jobId: { not: null }, createdAt: { gte: since } },
      _count: { _all: true },
    })
    for (const r of rows) if (r.jobId) map.set(r.jobId, r._count._all)
  } catch {
    /* ignore */
  }
  return map
}

/** Private-job apply/email/detail clicks in window, keyed by privateJobId. */
export async function privateJobClickCounts(since: Date): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  try {
    const rows = await prisma.jobClick.groupBy({
      by: ["privateJobId"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    })
    for (const r of rows) map.set(r.privateJobId, r._count._all)
  } catch {
    /* ignore */
  }
  return map
}

/** All-time BlogPost.views for fallback weighting, keyed by post id. */
export async function blogViewsAllTime(): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  try {
    const rows = await prisma.blogPost.findMany({
      where: { published: true },
      select: { id: true, views: true },
    })
    for (const r of rows) map.set(r.id, num(r.views))
  } catch {
    /* ignore */
  }
  return map
}
