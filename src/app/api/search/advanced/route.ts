import { NextRequest, NextResponse } from "next/server"
import { runSearch } from "@/lib/search-engine"
import { SEARCH_KINDS, type SearchKind, type SearchSort } from "@/lib/search-types"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const type = p.get("type") as SearchKind | null
  const sortParam = p.get("sort")
  const sort: SearchSort = sortParam === "latest" || sortParam === "deadline" ? sortParam : "relevance"
  const within = Number(p.get("within") || 0)
  try {
    const data = await runSearch({
      q: p.get("q") ?? "",
      kind: type && SEARCH_KINDS.includes(type) ? type : null,
      sort,
      withinDays: [1, 7, 30, 90].includes(within) ? within : undefined,
      openOnly: p.get("open") === "1",
      page: Number(p.get("page") || 1) || 1,
      pageSize: Number(p.get("limit") || 12) || 12,
    })
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=90" },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    )
  }
}
