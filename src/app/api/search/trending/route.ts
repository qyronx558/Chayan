import { NextResponse } from "next/server"
import { trendingTerms } from "@/lib/search-engine"
import { POPULAR_SEARCHES } from "@/lib/search-constants"

export const dynamic = "force-dynamic"

export async function GET() {
  const live = await trendingTerms(10)
  const terms = [...live, ...POPULAR_SEARCHES.filter((t) => !live.includes(t.toLowerCase()))].slice(0, 12)
  return NextResponse.json(
    { success: true, terms },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
  )
}
