/**
 * Daily expiry, run from GitHub Actions straight against the database: marks jobs
 * whose last date has passed as EXPIRED (same rules as /api/cron/expire-jobs), then
 * asks the site to refresh the affected listing pages once.
 *
 *   npx tsx scripts/ingest/expire.ts
 *
 * Env: DATABASE_URL, APP_URL + CRON_SECRET (page refresh; optional).
 */
import "./env"
import { prisma } from "../../src/lib/prisma"
import { todayIST } from "../../src/lib/ingest/normalize"
import { expirePrivateJobs } from "../../src/lib/private-jobs/lifecycle"
import { revalidateSite, type Revalidation } from "./site"

async function main() {
  const cutoff = new Date(`${todayIST()}T00:00:00.000Z`)
  const { count } = await prisma.job.updateMany({
    where: { status: { not: "EXPIRED" }, lastDate: { lt: cutoff } },
    data: { status: "EXPIRED" },
  })
  const privateExpired = await expirePrivateJobs(cutoff)
  console.log(JSON.stringify({ expired: count, privateExpired }))
  const changes: Revalidation[] = [
    ...(count > 0 ? [{ kind: "job" as const, slugs: [] }] : []),
    ...(privateExpired > 0 ? [{ kind: "private-job" as const, slugs: [] }] : []),
  ]
  await revalidateSite(changes, (m) => console.log(m))
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
