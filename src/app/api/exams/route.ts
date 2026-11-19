import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ENTITY_TYPE, FALLBACK_WINDOW_DAYS, TRENDING_WINDOW_DAYS } from "@/lib/trending/config"
import { jobViewSums, pageViewCounts, windowStart } from "@/lib/trending/queries"
import { viewTerm } from "@/lib/trending/score"
import { publicApiResponse } from "@/lib/cache"

/**
 * GET /api/exams[?sort=trending]
 * Default keeps recency order. sort=trending ranks exams by live demand:
 * active gov-job count per category + 7d human views on those jobs
 * (30d widening when cold, recency fallback when still cold).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get("sort") || "latest"

    const exams = await prisma.exam.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    })

    if (sort !== "trending") {
      return publicApiResponse({ success: true, data: exams }, "gov")
    }

    const since7 = windowStart(TRENDING_WINDOW_DAYS)
    const [counts, views7, pv7] = await Promise.all([
      prisma.job.groupBy({
        by: ["categoryId"],
        where: { moderation: "APPROVED", status: "ACTIVE" },
        _count: { _all: true },
      }),
      jobViewSums(since7),
      pageViewCounts([ENTITY_TYPE.jobs], since7),
    ])

    // Attribute job views to categories via recent active jobs.
    const jobs = await prisma.job.findMany({
      where: { moderation: "APPROVED", status: "ACTIVE" },
      select: { id: true, categoryId: true },
      orderBy: { createdAt: "desc" },
      take: 2000,
    })
    const viewsOf = (jobId: string) =>
      (views7.get(jobId) ?? 0) + (pv7.get(`${ENTITY_TYPE.jobs}:${jobId}`) ?? 0)

    const scoreFor = (categoryId: string): { score: number; engaged: boolean } => {
      const count = counts.find((c) => c.categoryId === categoryId)?._count._all ?? 0
      let views = 0
      for (const j of jobs) {
        if (j.categoryId === categoryId) views += viewsOf(j.id)
      }
      return { score: 2 * viewTerm(count) + 3 * viewTerm(views), engaged: count > 0 || views > 0 }
    }

    let windowDays = TRENDING_WINDOW_DAYS
    let scored = exams.map((e) => ({ exam: e, ...scoreFor(e.categoryId) }))
    if (scored.length > 0 && scored.every((s) => !s.engaged)) {
      // Widen to 30d engagement before giving up to recency order.
      const since30 = windowStart(FALLBACK_WINDOW_DAYS)
      const [views30, pv30] = await Promise.all([
        jobViewSums(since30),
        pageViewCounts([ENTITY_TYPE.jobs], since30),
      ])
      const viewsOf30 = (jobId: string) =>
        (views30.get(jobId) ?? 0) + (pv30.get(`${ENTITY_TYPE.jobs}:${jobId}`) ?? 0)
      scored = exams.map((e) => {
        const count = counts.find((c) => c.categoryId === e.categoryId)?._count._all ?? 0
        let views = 0
        for (const j of jobs) {
          if (j.categoryId === e.categoryId) views += viewsOf30(j.id)
        }
        return { exam: e, score: 2 * viewTerm(count) + 3 * viewTerm(views), engaged: count > 0 || views > 0 }
      })
      windowDays = FALLBACK_WINDOW_DAYS
    }

    const fallback = scored.length > 0 && scored.every((s) => !s.engaged)
    if (!fallback) {
      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return b.exam.createdAt.getTime() - a.exam.createdAt.getTime()
      })
    }
    return publicApiResponse({
      success: true,
      data: scored.map((s) => s.exam),
      trending: { fallback, windowDays },
    }, "gov")
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch exams" },
      { status: 500 }
    )
  }
}
