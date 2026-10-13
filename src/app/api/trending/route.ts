import { NextRequest, NextResponse } from "next/server"
import { getTrending } from "@/lib/trending/rank"
import { TRENDING_MODULES, type TrendingModule } from "@/lib/trending/config"
import { publicApiResponse } from "@/lib/cache"

export const dynamic = "force-dynamic"

const isModule = (v: string | null): v is Exclude<TrendingModule, "exams"> =>
  !!v && (TRENDING_MODULES as string[]).includes(v)

/**
 * GET /api/trending?module=jobs&limit=8
 * Popularity-ranked items for one home module (7d window, 30d widening,
 * recency fallback when cold). APPROVED content only. Cached 5 min.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const moduleParam = searchParams.get("module")
    const limit = Math.min(24, Math.max(1, parseInt(searchParams.get("limit") || "8")))

    if (!isModule(moduleParam)) {
      return NextResponse.json(
        { success: false, error: `Invalid module. Use one of: ${TRENDING_MODULES.join(", ")}` },
        { status: 400 }
      )
    }

    const result = await getTrending(moduleParam, limit)
    return publicApiResponse({ success: true, module: moduleParam, ...result }, 300)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load trending" },
      { status: 500 }
    )
  }
}
