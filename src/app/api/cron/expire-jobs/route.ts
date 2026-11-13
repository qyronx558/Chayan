import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidatePublicContent } from "@/lib/cache"
import { requireSecret } from "@/lib/ingest/auth"
import { todayIST } from "@/lib/ingest/normalize"

export const dynamic = "force-dynamic"

/**
 * GET (Bearer CRON_SECRET) - marks jobs whose last date has passed as EXPIRED,
 * so listings, location pages and ads never point readers at closed forms.
 */
export async function GET(request: NextRequest) {
  const denied = requireSecret(request, "CRON_SECRET")
  if (denied) return denied
  // lastDate is stored as a calendar day; anything before today (IST) is closed.
  const cutoff = new Date(`${todayIST()}T00:00:00.000Z`)
  const { count } = await prisma.job.updateMany({
    where: { status: { not: "EXPIRED" }, lastDate: { lt: cutoff } },
    data: { status: "EXPIRED" },
  })
  if (count > 0) {
    try {
      revalidatePublicContent("job")
    } catch {
      // best-effort
    }
  }
  return NextResponse.json({ success: true, expired: count })
}
