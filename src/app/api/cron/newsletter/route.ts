import { NextRequest, NextResponse } from "next/server"
import { runNewsletterDigest } from "@/lib/newsletter-digest"

export const dynamic = "force-dynamic"

/**
 * Cron trigger for the newsletter digest.
 * Call with either:
 *   Authorization: Bearer <CRON_SECRET>
 *   GET /api/cron/newsletter?secret=<CRON_SECRET>
 *
 * Scheduled via .github/workflows/newsletter-digest.yml
 * (Mon, Wed, Fri, Sat at 08:00 IST). The digest itself is idempotent,
 * so overlapping triggers can never double-send.
 */
export async function GET(request: NextRequest) {
  const configured = process.env.CRON_SECRET
  if (!configured) {
    return NextResponse.json(
      { success: false, error: "CRON_SECRET is not configured" },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get("authorization")
  const querySecret = new URL(request.url).searchParams.get("secret")

  if (authHeader !== `Bearer ${configured}` && querySecret !== configured) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runNewsletterDigest()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[newsletter-cron] failed:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Digest failed" },
      { status: 500 }
    )
  }
}
