import { NextRequest, NextResponse } from "next/server"
import { requireSecret } from "@/lib/ingest/auth"
import type { BotRuntimeConfig } from "@/lib/ingest/control"
import { getBotSettings, getSourceOverrides } from "@/lib/ingest/settings"

export const dynamic = "force-dynamic"

/** GET → the Admin → Content bot settings + source overrides, read by the scraper at the start of every run. */
export async function GET(request: NextRequest) {
  const denied = requireSecret(request)
  if (denied) return denied
  const [{ saved: _saved, updatedAt: _updatedAt, ...settings }, sources] = await Promise.all([getBotSettings(), getSourceOverrides()])
  const config: BotRuntimeConfig = { settings, sources }
  return NextResponse.json({ success: true, ...config })
}
