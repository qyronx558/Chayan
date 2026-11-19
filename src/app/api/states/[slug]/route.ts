import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stateSchema } from "@/lib/validations"
import { toSlug } from "@/lib/locations"
import { findStateBySlugOrId } from "@/lib/locations-server"
import { revalidateLocationPages } from "@/lib/cache"
import { staffAudit } from "@/lib/moderation"
import { locationConflictResponse, requireSuperAdmin, serverError } from "@/lib/location-api"

type Ctx = { params: Promise<{ slug: string }> }

/** PUT /api/states/[slug|id] - super-admin only. */
export async function PUT(request: NextRequest, { params }: Ctx) {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  try {
    const { slug: key } = await params
    const existing = await findStateBySlugOrId(key)
    if (!existing) return NextResponse.json({ success: false, error: "State not found" }, { status: 404 })

    const validation = stateSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }
    const { name, slug, type } = validation.data
    const state = await prisma.state.update({
      where: { id: existing.id },
      data: { name, slug: slug || toSlug(name), type },
    })
    await staffAudit({
      action: "UPDATE",
      entity: "State",
      entityId: state.id,
      user: guard.user,
      note: `Updated state "${existing.name}" → "${state.name}" (${state.slug}, ${state.type})`,
    })
    revalidateLocationPages(existing.slug)
    if (state.slug !== existing.slug) revalidateLocationPages(state.slug)
    return NextResponse.json({ success: true, data: state })
  } catch (err) {
    return locationConflictResponse(err, "State") ?? serverError(err, "Failed to update state")
  }
}

/** DELETE /api/states/[slug|id] - super-admin only; refused while jobs or districts use it. */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  try {
    const { slug: key } = await params
    const existing = await findStateBySlugOrId(key)
    if (!existing) return NextResponse.json({ success: false, error: "State not found" }, { status: 404 })

    const [jobs, districts] = await Promise.all([
      prisma.job.count({ where: { stateId: existing.id } }),
      prisma.district.count({ where: { stateId: existing.id } }),
    ])
    if (jobs > 0 || districts > 0) {
      const parts = [jobs ? `${jobs} job(s)` : "", districts ? `${districts} district(s)` : ""].filter(Boolean)
      return NextResponse.json(
        { success: false, error: `Cannot delete "${existing.name}": it still has ${parts.join(" and ")}.` },
        { status: 409 }
      )
    }

    await prisma.state.delete({ where: { id: existing.id } })
    await staffAudit({ action: "DELETE", entity: "State", entityId: existing.id, user: guard.user, note: `Deleted state "${existing.name}"` })
    revalidateLocationPages(existing.slug)
    return NextResponse.json({ success: true })
  } catch (err) {
    return serverError(err, "Failed to delete state")
  }
}
