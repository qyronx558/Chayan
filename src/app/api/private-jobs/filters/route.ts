import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { publicApiResponse } from "@/lib/cache"
import { countryName } from "@/lib/private-jobs/geo"

/** Facet options for the private-jobs filters. Aggregated in the database, never row by row. */
const LIVE = Prisma.sql`"status" = 'ACTIVE' AND "moderation" = 'APPROVED'`

export async function GET() {
  try {
    const [companies, locations, types, remotes, categories, skills, countries] = await Promise.all([
      // Only companies that are hiring right now (not every company ever created).
      prisma.company.findMany({
        where: { privateJob: { some: { status: "ACTIVE", moderation: "APPROVED" } } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, verifiedStatus: true },
        take: 1000,
      }),
      prisma.$queryRaw<{ v: string }[]>`
        SELECT "location" AS v FROM "PrivateJob"
        WHERE ${LIVE} AND "location" IS NOT NULL AND "location" <> ''
        GROUP BY "location" ORDER BY COUNT(*) DESC LIMIT 200`,
      prisma.privateJob.groupBy({ by: ["type"], where: { status: "ACTIVE", moderation: "APPROVED" } }),
      prisma.privateJob.groupBy({
        by: ["remotePolicy"],
        where: { status: "ACTIVE", moderation: "APPROVED", remotePolicy: { not: null } },
      }),
      prisma.$queryRaw<{ v: string }[]>`
        SELECT "category" AS v FROM "PrivateJob"
        WHERE ${LIVE} AND "category" IS NOT NULL AND "category" <> ''
        GROUP BY "category" ORDER BY COUNT(*) DESC LIMIT 100`,
      prisma.$queryRaw<{ v: string }[]>`
        SELECT s AS v FROM "PrivateJob", unnest("skills") AS s
        WHERE ${LIVE}
        GROUP BY s ORDER BY COUNT(*) DESC LIMIT 40`,
      prisma.$queryRaw<{ v: string; n: bigint }[]>`
        SELECT "country" AS v, COUNT(*) AS n FROM "PrivateJob"
        WHERE ${LIVE} AND "country" IS NOT NULL AND "country" <> ''
        GROUP BY "country" ORDER BY COUNT(*) DESC LIMIT 250`,
    ])

    const sortAlpha = (rows: { v: string }[]) => rows.map((r) => r.v).sort((a, b) => a.localeCompare(b))
    return publicApiResponse(
      {
        success: true,
        data: {
          companies,
          locations: sortAlpha(locations),
          types: types.map((t) => t.type).sort(),
          remotes: remotes.map((r) => r.remotePolicy as string).sort(),
          skills: skills.map((s) => s.v),
          categories: sortAlpha(categories),
          // Countries with live openings (code + English name + count); cities: /api/private-jobs/cities?country=XX
          countries: countries
            .map((c) => ({ code: c.v, name: countryName(c.v), count: Number(c.n) }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        },
      },
      300
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch filters" },
      { status: 500 }
    )
  }
}
