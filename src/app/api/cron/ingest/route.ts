import { NextRequest, NextResponse } from "next/server"
import { parseBody, requireSecret } from "@/lib/ingest/auth"
import { ingestBatchSchema } from "@/lib/ingest/schema"
import { ingestBatch } from "@/lib/ingest/service"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * POST /api/cron/ingest - called by scripts/ingest/run.ts (GitHub Actions).
 * Body: { items: IngestPost[] } (max 25). Every item is re-verified, scored
 * and stored as PENDING unless the auto-approve policy allows publishing.
 */
export async function POST(request: NextRequest) {
  const denied = requireSecret(request)
  if (denied) return denied
  const body = await parseBody(request, ingestBatchSchema)
  if ("response" in body) return body.response
  try {
    const results = await ingestBatch(body.data.items)
    return NextResponse.json({ success: true, results })
  } catch (e) {
    console.error("[ingest] batch failed", e)
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Ingest failed" }, { status: 500 })
  }
}
