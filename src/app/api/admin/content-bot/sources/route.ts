import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { migrationHint, requireBotAdmin } from "@/lib/ingest/admin"
import { FILE_SOURCES } from "@/lib/ingest/catalog"
import { applySourceOverrides, customSourceId, customSourceSchema } from "@/lib/ingest/control"
import { getSourceOverrides } from "@/lib/ingest/settings"
import type { SourceDef } from "@/lib/ingest/types"
import { writeAuditLog } from "@/lib/moderation"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 50
const STATS_DAYS = 30

async function allSources() {
  const overrides = await getSourceOverrides()
  const customIds = new Set(overrides.filter((o) => o.custom).map((o) => o.id))
  return { sources: applySourceOverrides(FILE_SOURCES, overrides), customIds }
}

const bad = (error: string, status = 400) => NextResponse.json({ success: false, error }, { status })

/** GET ?q=&level=&state=&status=all|enabled|disabled|custom&page= → sources with 30-day results. */
export async function GET(request: NextRequest) {
  const guard = await requireBotAdmin()
  if (!guard.ok) return guard.response
  const sp = request.nextUrl.searchParams
  const q = (sp.get("q") ?? "").trim().toLowerCase()
  const level = sp.get("level") ?? ""
  const state = sp.get("state") ?? ""
  const status = sp.get("status") ?? "all"
  const page = Math.max(1, Number(sp.get("page")) || 1)

  const { sources, customIds } = await allSources()
  const filtered = sources.filter((s) => {
    if (level && s.level !== level) return false
    if (state && s.state !== state) return false
    if (status === "enabled" && s.disabled) return false
    if (status === "disabled" && !s.disabled) return false
    if (status === "custom" && !customIds.has(s.id)) return false
    if (q && ![s.id, s.name, s.state, s.district, s.url].some((v) => v?.toLowerCase().includes(q))) return false
    return true
  })
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const since = new Date(Date.now() - STATS_DAYS * 86400_000)
  const groups = pageItems.length
    ? await prisma.ingestItem
        .groupBy({
          by: ["sourceId", "status"],
          where: { sourceId: { in: pageItems.map((s) => s.id) }, createdAt: { gte: since } },
          _count: { _all: true },
          _max: { createdAt: true },
        })
        .catch(() => [])
    : []
  const stats = new Map<string, { posted: number; duplicate: number; skipped: number; failed: number; lastActivity: Date | null }>()
  for (const g of groups) {
    const cur = stats.get(g.sourceId) ?? { posted: 0, duplicate: 0, skipped: 0, failed: 0, lastActivity: null }
    cur[g.status.toLowerCase() as "posted" | "duplicate" | "skipped" | "failed"] = g._count._all
    const last = g._max.createdAt
    if (last && (!cur.lastActivity || last > cur.lastActivity)) cur.lastActivity = last
    stats.set(g.sourceId, cur)
  }

  const totals = (["CENTRAL", "STATE", "DISTRICT"] as const).map((lv) => {
    const of = sources.filter((s) => s.level === lv)
    return { level: lv, total: of.length, enabled: of.filter((s) => !s.disabled).length }
  })

  return NextResponse.json({
    success: true,
    total: filtered.length,
    page,
    pageSize: PAGE_SIZE,
    totals,
    states: [...new Set(sources.map((s) => s.state).filter(Boolean))].sort(),
    items: pageItems.map((s) => ({
      ...s,
      enabled: !s.disabled,
      custom: customIds.has(s.id),
      stats: stats.get(s.id) ?? { posted: 0, duplicate: 0, skipped: 0, failed: 0, lastActivity: null },
    })),
  })
}

/** Check that state / district names match the seeded location rows, so posts land on the right pages. */
async function locationError(def: Pick<SourceDef, "state" | "district">): Promise<string | null> {
  if (!def.state) return null
  const st = await prisma.state.findUnique({ where: { name: def.state }, select: { id: true } })
  if (!st) return `State "${def.state}" does not exist - use the exact name from Admin → Locations`
  if (def.district) {
    const d = await prisma.district.findFirst({ where: { stateId: st.id, name: def.district }, select: { id: true } })
    if (!d) return `District "${def.district}" does not exist in ${def.state} - use the exact name from Admin → Locations`
  }
  return null
}

/** POST {source fields} → add a custom source. */
export async function POST(request: NextRequest) {
  const guard = await requireBotAdmin()
  if (!guard.ok) return guard.response
  const parsed = customSourceSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid source")
  const def = parsed.data
  const locErr = await locationError(def)
  if (locErr) return bad(locErr)

  const { sources } = await allSources()
  const taken = new Set(sources.map((s) => s.id))
  if (sources.some((s) => s.url === def.url)) return bad("A source with this listing URL already exists")
  let id = customSourceId(def.name)
  for (let n = 2; taken.has(id); n++) id = `${customSourceId(def.name)}-${n}`

  try {
    await prisma.ingestSource.create({
      data: { id, custom: true, enabled: true, def: { ...def, id }, updatedById: guard.user.id },
    })
  } catch (e) {
    return bad(migrationHint(e) ?? "Could not save the source", 500)
  }
  await writeAuditLog({ action: "CREATE", entity: "IngestSource", entityId: id, userId: guard.user.id, details: def.url })
  return NextResponse.json({ success: true, id })
}

const patchSchema = z.union([
  z.object({ ids: z.array(z.string().min(1).max(120)).min(1).max(1000), enabled: z.boolean() }).strict(),
  z.object({ id: z.string().min(1).max(120), def: z.unknown() }).strict(),
])

/** PATCH {ids, enabled} → switch sources on/off (bulk) · {id, def} → edit a custom source. */
export async function PATCH(request: NextRequest) {
  const guard = await requireBotAdmin()
  if (!guard.ok) return guard.response
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return bad("Invalid request")
  const { sources, customIds } = await allSources()
  const known = new Set(sources.map((s) => s.id))

  try {
    if ("ids" in parsed.data) {
      const { ids, enabled } = parsed.data
      const unknown = ids.find((id) => !known.has(id))
      if (unknown) return bad(`Unknown source "${unknown}"`)
      await prisma.$transaction(
        ids.map((id) =>
          prisma.ingestSource.upsert({
            where: { id },
            create: { id, enabled, custom: false, updatedById: guard.user.id },
            update: { enabled, updatedById: guard.user.id },
          }),
        ),
      )
      await writeAuditLog({
        action: "UPDATE",
        entity: "IngestSource",
        entityId: ids.length === 1 ? ids[0] : `${ids.length} sources`,
        userId: guard.user.id,
        details: `${enabled ? "enabled" : "disabled"}: ${ids.slice(0, 50).join(", ")}`.slice(0, 1000),
      })
      return NextResponse.json({ success: true, updated: ids.length })
    }

    const { id, def: rawDef } = parsed.data
    if (!customIds.has(id)) return bad("Only custom sources can be edited - built-in ones can only be switched on or off")
    const def = customSourceSchema.safeParse(rawDef)
    if (!def.success) return bad(def.error.issues[0]?.message ?? "Invalid source")
    const locErr = await locationError(def.data)
    if (locErr) return bad(locErr)
    if (sources.some((s) => s.id !== id && s.url === def.data.url)) return bad("A source with this listing URL already exists")
    await prisma.ingestSource.update({ where: { id }, data: { def: { ...def.data, id }, updatedById: guard.user.id } })
    await writeAuditLog({ action: "UPDATE", entity: "IngestSource", entityId: id, userId: guard.user.id, details: def.data.url })
    return NextResponse.json({ success: true, id })
  } catch (e) {
    return bad(migrationHint(e) ?? "Could not update sources", 500)
  }
}

/** DELETE ?id= → remove a custom source (built-in sources can only be disabled). */
export async function DELETE(request: NextRequest) {
  const guard = await requireBotAdmin()
  if (!guard.ok) return guard.response
  const id = request.nextUrl.searchParams.get("id") ?? ""
  const { customIds } = await allSources()
  if (!customIds.has(id)) return bad("Only custom sources can be deleted - switch built-in sources off instead")
  await prisma.ingestSource.delete({ where: { id } })
  await writeAuditLog({ action: "DELETE", entity: "IngestSource", entityId: id, userId: guard.user.id })
  return NextResponse.json({ success: true })
}
