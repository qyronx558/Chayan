import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

/**
 * Live private jobs that should close now:
 *  - the application last date (a calendar day) is before today, or
 *  - the hard expiry passed (feed postings not seen for FEED_EXPIRY_DAYS, e.g. feed disabled).
 */
export function expiredPrivateJobsWhere(today: Date, now: Date): Prisma.PrivateJobWhereInput {
  return {
    status: "ACTIVE",
    OR: [{ lastDate: { lt: today } }, { expiresAt: { lt: now } }],
  }
}

export async function expirePrivateJobs(today: Date, now = new Date()): Promise<number> {
  const { count } = await prisma.privateJob.updateMany({
    where: expiredPrivateJobsWhere(today, now),
    data: { status: "EXPIRED", closedAt: now },
  })
  return count
}
