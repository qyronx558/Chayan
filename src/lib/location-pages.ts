import { cache } from "react"
import { unstable_cache } from "next/cache"
import { CACHE_TAGS } from "@/lib/cache"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/** Jobs a visitor can still act on (live + approved). */
export const LIVE_JOB_WHERE: Prisma.JobWhereInput = { moderation: "APPROVED", status: { not: "EXPIRED" } }

export const getStateBySlug = cache((slug: string) =>
  prisma.state.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      districts: { orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } },
    },
  })
)

export const getDistrictBySlugs = cache((stateSlug: string, districtSlug: string) =>
  prisma.district.findFirst({
    where: { slug: districtSlug, state: { slug: stateSlug } },
    select: { id: true, name: true, slug: true, state: { select: { id: true, name: true, slug: true, type: true } } },
  })
)

const loadStateJobCounts = unstable_cache(
  async () => {
    const [byState, central] = await Promise.all([
      prisma.job.groupBy({
        by: ["stateId"],
        where: { ...LIVE_JOB_WHERE, jobLevel: { in: ["STATE", "DISTRICT"] } },
        _count: { _all: true },
      }),
      prisma.job.count({ where: { ...LIVE_JOB_WHERE, jobLevel: "CENTRAL" } }),
    ])
    return {
      byState: byState.filter((r) => r.stateId).map((r) => [r.stateId as string, r._count._all] as const),
      central,
    }
  },
  ["state-job-counts"],
  { tags: [CACHE_TAGS.govCounts], revalidate: 21600 }
)

/** Live state- and district-level job counts per state + the all-India central count. */
export async function getStateJobCounts() {
  const { byState, central } = await loadStateJobCounts()
  return { byState: new Map(byState), central }
}

/** Live district-level job counts per district of one state. */
export async function getDistrictJobCounts(stateId: string) {
  const rows = await prisma.job.groupBy({
    by: ["districtId"],
    where: { ...LIVE_JOB_WHERE, jobLevel: "DISTRICT", stateId },
    _count: { _all: true },
  })
  return new Map(rows.filter((r) => r.districtId).map((r) => [r.districtId as string, r._count._all]))
}
