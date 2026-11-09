import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { runSearch } from "@/lib/search-engine"
import type { SearchHit, SearchKind } from "@/lib/search-types"

const searchSelect = {
  id: true,
  title: true,
  slug: true,
  department: { select: { name: true } },
  createdAt: true,
} as const

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") || ""
    const categoryParam = searchParams.get("category") || ""
    const department = searchParams.get("department") || ""
    const state = searchParams.get("state") || ""
    const status = searchParams.get("status") || ""
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "5")))

    // UI filters send a content type (job, private_job, ...), while other
    // callers send a real category id. Support both without breaking either.
    const TYPE_FILTERS = ["job", "private_job", "result", "admit_card", "answer_key", "blog"] as const
    const typeFilter = (TYPE_FILTERS as readonly string[]).includes(categoryParam)
      ? categoryParam
      : ""
    const category = typeFilter ? "" : categoryParam
    const wants = (type: (typeof TYPE_FILTERS)[number]) => !typeFilter || typeFilter === type

    // Fast path: ranked, typo-tolerant engine for plain text queries (hero dropdown,
    // header dialog). Falls through to the legacy id-filter query otherwise.
    if (q.trim() && !category && !department && !state && !status) {
      const legacyKinds: Record<string, SearchKind> = {
        jobs: "job", privateJobs: "private_job", results: "result",
        admitCards: "admit_card", answerKeys: "answer_key", blogs: "blog",
      }
      try {
        const res = await runSearch({
          q,
          kind: typeFilter ? (typeFilter as SearchKind) : null,
          pageSize: 30,
        })
        const pick = (kind: SearchKind) => res.hits.filter((h) => h.kind === kind).slice(0, limit)
        const shape = (h: SearchHit) => ({
          id: h.id, title: h.title, slug: h.slug, createdAt: h.date,
          department: { name: h.subtitle ?? "" }, company: { name: h.subtitle ?? "" }, category: { name: h.subtitle ?? "" },
        })
        const data = Object.fromEntries(
          Object.entries(legacyKinds).map(([key, kind]) => [key, pick(kind).map(shape)])
        )
        return NextResponse.json(
          { success: true, data },
          { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
        )
      } catch {
        // fall back to legacy query below
      }
    }

    const baseWhere: Record<string, unknown> = {}
    if (q) {
      baseWhere.OR = [
        { title: { contains: q, mode: "insensitive" as const } },
        { department: { name: { contains: q, mode: "insensitive" as const } } },
      ]
    }
    if (category) baseWhere.categoryId = category
    if (department) baseWhere.departmentId = department

    const jobWhere = { ...baseWhere }
    if (state) (jobWhere as Record<string, unknown>).stateId = state
    if (status) (jobWhere as Record<string, unknown>).status = status

    const blogWhere: Record<string, unknown> = { published: true }
    if (q) {
      blogWhere.OR = [
        { title: { contains: q, mode: "insensitive" as const } },
        { excerpt: { contains: q, mode: "insensitive" as const } },
        { tags: { contains: q, mode: "insensitive" as const } },
        { category: { name: { contains: q, mode: "insensitive" as const } } },
      ]
    }

    const [jobs, results, admitCards, answerKeys, privateJobs, blogs] = await Promise.all([
      prisma.job.findMany({
        where: jobWhere,
        select: { ...searchSelect, department: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: wants("job") ? limit : 0,
      }),
      prisma.result.findMany({
        where: baseWhere,
        select: searchSelect,
        orderBy: { createdAt: "desc" },
        take: wants("result") ? limit : 0,
      }),
      prisma.admitCard.findMany({
        where: baseWhere,
        select: searchSelect,
        orderBy: { createdAt: "desc" },
        take: wants("admit_card") ? limit : 0,
      }),
      prisma.answerKey.findMany({
        where: baseWhere,
        select: searchSelect,
        orderBy: { createdAt: "desc" },
        take: wants("answer_key") ? limit : 0,
      }),
      prisma.privateJob.findMany({
        where: q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { company: { name: { contains: q, mode: "insensitive" as const } } },
              ],
            }
          : {},
        select: { id: true, title: true, slug: true, company: { select: { name: true } }, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: wants("private_job") ? limit : 0,
      }),
      prisma.blogPost.findMany({
        where: blogWhere,
        select: { id: true, title: true, slug: true, category: { select: { name: true } }, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: wants("blog") ? limit : 0,
      }),
    ])

    const totalCount =
      jobs.length + results.length + admitCards.length + answerKeys.length + privateJobs.length + blogs.length;
    if (q.trim()) {
      (prisma as unknown as { searchQuery: { create: (a: unknown) => Promise<unknown> } }).searchQuery
        .create({ data: { term: q.trim().toLowerCase().slice(0, 200), resultCount: totalCount } })
        .catch(() => null);
    }
    return NextResponse.json(
      {
        success: true,
        data: { jobs, results, admitCards, answerKeys, privateJobs, blogs },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    )
  }
}
