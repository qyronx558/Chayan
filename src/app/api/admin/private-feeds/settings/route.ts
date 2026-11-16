import { NextRequest, NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/location-api"
import { migrationHint } from "@/lib/ingest/admin"
import { writeAuditLog } from "@/lib/moderation"
import { feedSettingsPatchSchema, getFeedSettings, saveFeedSettings } from "@/lib/private-jobs/settings"
import { geminiConfigured, geminiModel } from "@/lib/private-jobs/llm"

export const dynamic = "force-dynamic"

const guard = () => requireSuperAdmin("Only super admins can control private-job seeding")

function environment(model: string | null) {
  return {
    geminiConfigured: geminiConfigured(),
    effectiveModel: geminiModel(model),
    cronConfigured: Boolean(process.env.CRON_SECRET),
  }
}

export async function GET() {
  const g = await guard()
  if (!g.ok) return g.response
  const settings = await getFeedSettings()
  return NextResponse.json({ success: true, settings, environment: environment(settings.geminiModel) })
}

export async function PATCH(request: NextRequest) {
  const g = await guard()
  if (!g.ok) return g.response
  const parsed = feedSettingsPatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid settings" }, { status: 400 })
  }
  try {
    const settings = await saveFeedSettings(parsed.data, g.user.id)
    await writeAuditLog({
      action: "UPDATE",
      entity: "PrivateFeedSettings",
      entityId: "default",
      userId: g.user.id,
      details: JSON.stringify(parsed.data),
    })
    return NextResponse.json({ success: true, settings, environment: environment(settings.geminiModel) })
  } catch (e) {
    return NextResponse.json({ success: false, error: migrationHint(e) ?? "Failed to save settings" }, { status: 500 })
  }
}
