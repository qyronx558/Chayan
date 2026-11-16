import { NextRequest, NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/location-api"
import { migrationHint } from "@/lib/ingest/admin"
import { writeAuditLog } from "@/lib/moderation"
import { revalidatePublicContent } from "@/lib/cache"
import { fillMissingLogos } from "@/lib/private-jobs/logo"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * POST { force? } → finds real logos for companies with live private jobs that
 * still show initials (job board → website → Wikidata → icon services).
 * `force` re-checks companies looked up recently too.
 */
export async function POST(request: NextRequest) {
  const g = await requireSuperAdmin("Only super admins can manage job feeds")
  if (!g.ok) return g.response
  const body = (await request.json().catch(() => ({}))) as { force?: boolean }
  try {
    const r = await fillMissingLogos({ limit: 30, budgetMs: 50_000, force: body.force === true })
    if (r.found) {
      try {
        revalidatePublicContent("private-job")
      } catch {
        // best-effort
      }
    }
    await writeAuditLog({
      action: "UPDATE",
      entity: "Company",
      entityId: "logos",
      userId: g.user.id,
      details: `Logo lookup: ${r.found} found of ${r.checked} checked`,
    })
    return NextResponse.json({ success: true, ...r })
  } catch (e) {
    return NextResponse.json({ success: false, error: migrationHint(e) ?? "Logo lookup failed" }, { status: 500 })
  }
}
