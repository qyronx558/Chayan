import { NextRequest, NextResponse } from "next/server"
import { dispatchConfig, migrationHint, requireBotAdmin } from "@/lib/ingest/admin"
import { botSettingsPatchSchema } from "@/lib/ingest/control"
import { GEMINI_DEFAULT_MODEL } from "@/lib/ingest/extract"
import { getBotSettings, saveBotSettings } from "@/lib/ingest/settings"
import { writeAuditLog } from "@/lib/moderation"

export const dynamic = "force-dynamic"

export async function GET() {
  const guard = await requireBotAdmin()
  if (!guard.ok) return guard.response
  const settings = await getBotSettings()
  const dispatch = dispatchConfig()
  return NextResponse.json({
    success: true,
    settings,
    environment: {
      // Model the bot uses when the admin field is blank (GitHub variable / .env), shown as a hint.
      defaultModel: GEMINI_DEFAULT_MODEL,
      runNowConfigured: Boolean(dispatch),
      runTarget: dispatch?.target ?? null,
      repo: dispatch?.repo ?? null,
    },
  })
}

export async function PATCH(request: NextRequest) {
  const guard = await requireBotAdmin()
  if (!guard.ok) return guard.response
  const raw = await request.json().catch(() => null)
  const parsed = botSettingsPatchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid settings" }, { status: 400 })
  }
  try {
    const settings = await saveBotSettings(parsed.data, guard.user.id)
    await writeAuditLog({
      action: "UPDATE",
      entity: "IngestSettings",
      entityId: "default",
      userId: guard.user.id,
      details: JSON.stringify(parsed.data).slice(0, 1000),
    })
    return NextResponse.json({ success: true, settings })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: migrationHint(e) ?? "Could not save settings" },
      { status: 500 },
    )
  }
}
