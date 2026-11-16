import { NextRequest, NextResponse } from "next/server"
import { scheduleLogoLookup } from "@/lib/private-jobs/logo"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/location-api"
import { migrationHint } from "@/lib/ingest/admin"
import { writeAuditLog } from "@/lib/moderation"
import { findOrCreateCompanies } from "@/lib/companies"
import { COMPANY_CATALOG } from "@/lib/private-jobs/catalog"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const guard = () => requireSuperAdmin("Only super admins can manage job feeds")

/** GET → the curated catalog, each entry marked when its board is already added. */
export async function GET() {
  const g = await guard()
  if (!g.ok) return g.response
  try {
    const existing = await prisma.privateJobFeed.findMany({ select: { provider: true, boardToken: true } })
    const added = new Set(existing.map((f) => `${f.provider}:${f.boardToken.toLowerCase()}`))
    return NextResponse.json({
      success: true,
      data: COMPANY_CATALOG.map((c) => ({ ...c, added: added.has(`${c.provider}:${c.token.toLowerCase()}`) })),
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: migrationHint(e) ?? "Failed to load catalog" }, { status: 500 })
  }
}

const addSchema = z.object({
  ids: z.array(z.string().min(1).max(120)).min(1).max(COMPANY_CATALOG.length),
  /** worldwide (default): every opening; india: India & remote roles only. */
  scope: z.enum(["worldwide", "india"]).optional(),
})

/** POST { ids, scope } → add the selected catalog boards; they sync on the next runs. */
export async function POST(request: NextRequest) {
  const g = await guard()
  if (!g.ok) return g.response
  const parsed = addSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ success: false, error: "Choose at least one company" }, { status: 400 })
  const ids = new Set(parsed.data.ids)
  const wanted = COMPANY_CATALOG.filter((c) => ids.has(c.id))
  const indiaOnly = parsed.data.scope === "india"
  try {
    // Batched: a few queries whether 1 or 600 boards are picked.
    const existing = await prisma.privateJobFeed.findMany({
      where: { OR: wanted.map((w) => ({ provider: w.provider, boardToken: w.token })) },
      select: { provider: true, boardToken: true },
    })
    const have = new Set(existing.map((e) => `${e.provider}:${e.boardToken}`))
    const fresh = wanted.filter((w) => !have.has(`${w.provider}:${w.token}`))
    const companies = await findOrCreateCompanies(fresh.map((w) => ({ name: w.company, website: w.website })))
    const rows = fresh
      .filter((w) => companies.has(w.company.trim()))
      .map((w) => ({ provider: w.provider, boardToken: w.token, companyId: companies.get(w.company.trim())!, indiaOnly, createdById: g.user.id }))
    const { count: added } = rows.length ? await prisma.privateJobFeed.createMany({ data: rows, skipDuplicates: true }) : { count: 0 }
    const companyIds = [...new Set(rows.map((r) => r.companyId))]
    await writeAuditLog({
      action: "CREATE",
      entity: "PrivateJobFeed",
      entityId: "catalog",
      userId: g.user.id,
      details: `Added ${added} catalog boards (${indiaOnly ? "India & remote" : "worldwide"}): ${wanted.map((w) => w.id).join(", ").slice(0, 3000)}`,
    })
    scheduleLogoLookup(companyIds)
    return NextResponse.json({ success: true, added, skipped: wanted.length - added })
  } catch (e) {
    return NextResponse.json({ success: false, error: migrationHint(e) ?? "Failed to add catalog boards" }, { status: 500 })
  }
}
