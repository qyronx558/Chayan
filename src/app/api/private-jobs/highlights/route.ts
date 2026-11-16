import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicApiResponse } from "@/lib/cache"

/**
 * Live numbers for the private-jobs "Discover" panel: market pulse, counts for
 * the quick-explore tiles, top hiring companies and trending skills. Each part
 * is one aggregate query; the response is CDN-cached for 5 minutes.
 */
export async function GET() {
  try {
    const [pulse, companies, skills] = await Promise.all([
      prisma.$queryRaw<
        { live: bigint; today: bigint; week: bigint; companies: bigint; remote: bigint; fresher: bigint; intern: bigint; walkin: bigint; high: bigint }[]
      >`
        SELECT
          COUNT(*)                                                            AS live,
          COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '24 hours')  AS today,
          COUNT(*) FILTER (WHERE "createdAt" >= NOW() - INTERVAL '7 days')    AS week,
          COUNT(DISTINCT "companyId")                                         AS companies,
          COUNT(*) FILTER (WHERE "remotePolicy" = 'REMOTE')                   AS remote,
          COUNT(*) FILTER (WHERE "isFresherFriendly")                         AS fresher,
          COUNT(*) FILTER (WHERE "type" = 'INTERNSHIP')                       AS intern,
          COUNT(*) FILTER (WHERE "isWalkIn")                                  AS walkin,
          COUNT(*) FILTER (WHERE "salaryMax" >= 1000000)                      AS high
        FROM "PrivateJob"
        WHERE "status" = 'ACTIVE' AND "moderation" = 'APPROVED'`,
      prisma.$queryRaw<{ id: string; name: string; slug: string; logo: string | null; verifiedStatus: string; open: bigint; fresh: bigint }[]>`
        SELECT c."id", c."name", c."slug", c."logo", c."verifiedStatus"::text AS "verifiedStatus",
               COUNT(*) AS open,
               COUNT(*) FILTER (WHERE j."createdAt" >= NOW() - INTERVAL '7 days') AS fresh
        FROM "PrivateJob" j JOIN "Company" c ON c."id" = j."companyId"
        WHERE j."status" = 'ACTIVE' AND j."moderation" = 'APPROVED'
        GROUP BY c."id"
        ORDER BY COUNT(*) FILTER (WHERE j."createdAt" >= NOW() - INTERVAL '7 days') DESC, COUNT(*) DESC
        LIMIT 10`,
      prisma.$queryRaw<{ v: string; n: bigint }[]>`
        SELECT s AS v, COUNT(*) AS n FROM "PrivateJob", unnest("skills") AS s
        WHERE "status" = 'ACTIVE' AND "moderation" = 'APPROVED'
        GROUP BY s ORDER BY COUNT(*) DESC LIMIT 10`,
    ])
    const p = pulse[0]
    const n = (v: bigint | undefined) => Number(v ?? 0)
    return publicApiResponse(
      {
        success: true,
        data: {
          pulse: {
            live: n(p?.live),
            today: n(p?.today),
            week: n(p?.week),
            companies: n(p?.companies),
          },
          tiles: {
            remote: n(p?.remote),
            fresher: n(p?.fresher),
            internship: n(p?.intern),
            walkin: n(p?.walkin),
            highSalary: n(p?.high),
          },
          companies: companies.map((c) => ({ ...c, open: n(c.open), fresh: n(c.fresh) })),
          skills: skills.map((s) => ({ name: s.v, count: n(s.n) })),
        },
      },
      300
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load highlights" },
      { status: 500 }
    )
  }
}
