import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { publicApiResponse } from "@/lib/cache"

/**
 * GET ?country=IN → cities with openings in that country, busiest first
 * ({ name, count }). `scope=all` also counts closed / unpublished jobs, so the
 * admin job form can offer every city used before.
 */
export async function GET(request: NextRequest) {
  const country = (request.nextUrl.searchParams.get("country") || "").trim().slice(0, 60)
  if (!country) return NextResponse.json({ success: false, error: "country is required" }, { status: 400 })
  const all = request.nextUrl.searchParams.get("scope") === "all"
  const live = all ? Prisma.empty : Prisma.sql`AND "status" = 'ACTIVE' AND "moderation" = 'APPROVED'`
  try {
    const rows = await prisma.$queryRaw<{ v: string; n: bigint }[]>`
      SELECT "city" AS v, COUNT(*) AS n FROM "PrivateJob"
      WHERE "country" = ${country} AND "city" IS NOT NULL AND "city" <> '' ${live}
      GROUP BY "city" ORDER BY COUNT(*) DESC, "city" ASC LIMIT 500`
    return publicApiResponse({ success: true, data: rows.map((r) => ({ name: r.v, count: Number(r.n) })) }, "private")
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to fetch cities" }, { status: 500 })
  }
}
