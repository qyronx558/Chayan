import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { districtSchema } from "@/lib/validations"
import { toSlug } from "@/lib/locations"
import { revalidateLocationPages } from "@/lib/cache"
import { staffAudit } from "@/lib/moderation"
import { locationConflictResponse, requireSuperAdmin, serverError } from "@/lib/location-api"

type Ctx = { params: Promise<{ id: string }> }

/** PUT /api/districts/[id] - super-admin only (rename / re-slug; the state never changes). */
export async function PUT(request: NextRequest, { params }: Ctx) {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  try {
    const { id } = await params
    const existing = await prisma.district.findUnique({ where: { id }, include: { state: { select: { name: true } } } })
    if (!existing) return NextResponse.json({ success: false, error: "District not found" }, { status: 404 })

    const validation = districtSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }
    const { name, slug } = validation.data
    const district = await prisma.district.update({ where: { id }, data: { name, slug: slug || toSlug(name) } })
    await staffAudit({
      action: "UPDATE",
      entity: "District",
      entityId: id,
      user: guard.user,
      note: `Updated district "${existing.name}" → "${district.name}" in ${existing.state.name}`,
    })
    revalidateLocationPages()
    return NextResponse.json({ success: true, data: district })
  } catch (err) {
    return locationConflictResponse(err, "District") ?? serverError(err, "Failed to update district")
  }
}

/** DELETE /api/districts/[id] - super-admin only; refused while jobs use it. */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  try {
    const { id } = await params
    const existing = await prisma.district.findUnique({ where: { id }, include: { state: { select: { name: true } } } })
    if (!existing) return NextResponse.json({ success: false, error: "District not found" }, { status: 404 })

    const jobs = await prisma.job.count({ where: { districtId: id } })
    if (jobs > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete "${existing.name}": ${jobs} job(s) are posted for this district.` },
        { status: 409 }
      )
    }
    await prisma.district.delete({ where: { id } })
    await staffAudit({
      action: "DELETE",
      entity: "District",
      entityId: id,
      user: guard.user,
      note: `Deleted district "${existing.name}" in ${existing.state.name}`,
    })
    revalidateLocationPages()
    return NextResponse.json({ success: true })
  } catch (err) {
    return serverError(err, "Failed to delete district")
  }
}
