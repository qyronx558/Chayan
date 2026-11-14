import { NextRequest, NextResponse } from "next/server"
import { requireSecret } from "@/lib/ingest/auth"
import { dispatchConfig, dispatchWorkflow, SCHEDULE_SLOTS, scheduledInputs, type ScheduleSlot } from "@/lib/ingest/dispatch"

export const dynamic = "force-dynamic"

/**
 * GET ?slot=frequent|district  (Authorization: Bearer CRON_SECRET)
 *
 * On-time schedule for the content bot. GitHub's own cron runs this repo's
 * jobs hours late, so a free external cron (e.g. cron-job.org) calls this at
 * the exact times and it starts the workflow as a *scheduled* run - the
 * Admin → Content bot pause / tier switches still apply.
 *   frequent  every 4 hours   → central + state boards
 *   district  06:00 IST daily → all district portals
 */
export async function GET(request: NextRequest) {
  const denied = requireSecret(request, "CRON_SECRET")
  if (denied) return denied
  const slot = request.nextUrl.searchParams.get("slot") ?? ""
  if (!(slot in SCHEDULE_SLOTS)) {
    return NextResponse.json({ success: false, error: `slot must be one of: ${Object.keys(SCHEDULE_SLOTS).join(", ")}` }, { status: 400 })
  }
  const cfg = dispatchConfig()
  if (!cfg) return NextResponse.json({ success: false, error: "INGEST_GITHUB_TOKEN is not set on this site" }, { status: 500 })
  const started = await dispatchWorkflow(cfg, scheduledInputs(slot as ScheduleSlot, cfg.target))
  if (!started.ok) return NextResponse.json({ success: false, error: started.error }, { status: 502 })
  return NextResponse.json({ success: true, slot, target: cfg.target, startedAt: new Date().toISOString() })
}
