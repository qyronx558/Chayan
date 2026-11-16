/**
 * Fills PrivateJob.country / city from the location text for jobs saved before
 * those fields existed. Safe to re-run: only rows without a country are read.
 *
 *   npx tsx scripts/backfill-job-geo.ts
 */
import { PrismaClient } from "@prisma/client"
import { parseLocation } from "../src/lib/private-jobs/geo"

const prisma = new PrismaClient()

async function main() {
  let cursor: string | undefined
  let scanned = 0
  let filled = 0
  for (;;) {
    const rows = await prisma.privateJob.findMany({
      where: { country: null, location: { not: null } },
      select: { id: true, location: true, remotePolicy: true },
      orderBy: { id: "asc" },
      take: 500,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    if (!rows.length) break
    cursor = rows[rows.length - 1].id
    scanned += rows.length
    for (const r of rows) {
      const geo = parseLocation(r.location)
      if (!geo.country && !geo.city) continue
      await prisma.privateJob.update({ where: { id: r.id }, data: { country: geo.country, city: geo.city } })
      filled++
    }
    console.log(`  scanned ${scanned}, filled ${filled}`)
  }
  console.log(`Done: ${filled} of ${scanned} jobs now have a country/city.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
