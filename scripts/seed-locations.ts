/**
 * Seeds all Indian states, union territories and districts from
 * prisma/data/india_districts_statewise.csv. Safe to re-run (upserts only,
 * never deletes).
 *
 *   npm run db:seed:locations              # write
 *   npm run db:seed:locations -- --dry-run # report only
 */
import { PrismaClient } from "@prisma/client"
import { seedLocations } from "../src/lib/location-seed"

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const fileArg = process.argv.find((a) => a.startsWith("--file="))
  const prisma = new PrismaClient()
  try {
    console.log(`Seeding locations${dryRun ? " (dry run, nothing is written)" : ""}…`)
    const s = await seedLocations(prisma, { dryRun, file: fileArg?.slice("--file=".length) })
    console.log(`States:    ${s.states.created} created, ${s.states.updated} updated, ${s.states.unchanged} unchanged`)
    console.log(`Districts: ${s.districts.created} created, ${s.districts.updated} updated, ${s.districts.unchanged} unchanged`)
    if (s.extraStates.length) {
      console.log(`States in the database but not in the CSV (left untouched): ${s.extraStates.join(", ")}`)
    }
    if (!dryRun) {
      const [states, districts] = await Promise.all([prisma.state.count(), prisma.district.count()])
      console.log(`Totals now: ${states} states/UTs, ${districts} districts`)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
