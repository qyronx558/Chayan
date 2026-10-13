import { NextRequest, NextResponse } from "next/server"
import { getTrendingOverview } from "@/lib/trending/rank"
import { publicApiResponse } from "@/lib/cache"

export const dynamic = "force-dynamic"

/**
 * GET /api/trending/overview?limitPerModule=6
 * One batched call for the home TrendingNow strip - every module scored
 * from a single shared signal batch. Cached 5 min.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitPerModule = Math.min(12, Math.max(1, parseInt(searchParams.get("limitPerModule") || "6")))
    const result = await getTrendingOverview(limitPerModule)
    return publicApiResponse({ success: true, data: result }, 300)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load trending overview" },
      { status: 500 }
    )
  }
}
