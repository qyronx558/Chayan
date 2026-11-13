import { NextRequest, NextResponse } from "next/server"
import { parseBody, requireSecret } from "@/lib/ingest/auth"
import { seenRequestSchema } from "@/lib/ingest/schema"
import { filterUnseen } from "@/lib/ingest/service"

export const dynamic = "force-dynamic"

/** POST { urls[] } → { unseen[] }: lets the scraper skip notices it already handled before any LLM call. */
export async function POST(request: NextRequest) {
  const denied = requireSecret(request)
  if (denied) return denied
  const body = await parseBody(request, seenRequestSchema)
  if ("response" in body) return body.response
  const unseen = await filterUnseen(body.data.urls)
  return NextResponse.json({ success: true, unseen })
}
