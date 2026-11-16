import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicApiResponse } from "@/lib/cache"
import { allCountries, countryName } from "@/lib/private-jobs/geo"

/**
 * GET → every country for pickers: those already used by jobs first (with
 * counts, including custom names admins typed), then the full ISO list.
 */
export async function GET() {
  try {
    const used = await prisma.$queryRaw<{ v: string; n: bigint }[]>`
      SELECT "country" AS v, COUNT(*) AS n FROM "PrivateJob"
      WHERE "country" IS NOT NULL AND "country" <> ''
      GROUP BY "country" ORDER BY COUNT(*) DESC LIMIT 300`
    const counts = new Map(used.map((u) => [u.v, Number(u.n)]))
    const iso = allCountries().map((c) => ({ ...c, count: counts.get(c.code) ?? 0 }))
    const custom = used.filter((u) => !iso.some((c) => c.code === u.v)).map((u) => ({ code: u.v, name: countryName(u.v), count: Number(u.n) }))
    const data = [...iso, ...custom].sort((a, b) => Number(b.count > 0) - Number(a.count > 0) || a.name.localeCompare(b.name))
    return publicApiResponse({ success: true, data }, 300)
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to fetch countries" }, { status: 500 })
  }
}
