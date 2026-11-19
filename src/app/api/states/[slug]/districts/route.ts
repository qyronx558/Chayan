import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { districtSchema } from "@/lib/validations"
import { toSlug } from "@/lib/locations"
import { findStateBySlugOrId } from "@/lib/locations-server"
import { publicApiResponse, revalidateLocationPages } from "@/lib/cache"
import { staffAudit } from "@/lib/moderation"
import { locationConflictResponse, requireSuperAdmin, serverError } from "@/lib/location-api"

type Ctx = { params: Promise<{ slug: string }> }

/**
 * GET /api/states/[slug|id]/districts - public.
 * Accepts the state slug (public filters) or id (admin pickers).
 * ?withJobCounts=1 adds `jobCount` per district (super-admin locations page).
 */
export async function GET(request: NextRequest, { params }: Ctx) {
  try {
    const { slug: key } = await params
    const state = await findStateBySlugOrId(key)
    if (!state) return NextResponse.json({ success: false, error: "State not found" }, { status: 404 })
    const withJobCounts = new URL(request.url).searchParams.get("withJobCounts") === "1"

    const districts = await prisma.district.findMany({
      where: { stateId: state.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, stateId: true, ...(withJobCounts ? { _count: { select: { jobs: true } } } : {}) },
    })
    const data = districts.map(({ _count, ...d }) => ({ ...d, ...(_count ? { jobCount: _count.jobs } : {}) }))
    const body = { success: true, state, data }
    // Admin view (job counts) must be fresh; the public list can sit on the CDN.
    return withJobCounts ? NextResponse.json(body) : publicApiResponse(body, "gov")
  } catch (err) {
    return serverError(err, "Failed to fetch districts")
  }
}

/** POST /api/states/[slug|id]/districts - super-admin only. */
export async function POST(request: NextRequest, { params }: Ctx) {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  try {
    const { slug: key } = await params
    const state = await findStateBySlugOrId(key)
    if (!state) return NextResponse.json({ success: false, error: "State not found" }, { status: 404 })

    const validation = districtSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }
    const { name, slug } = validation.data
    const district = await prisma.district.create({ data: { name, slug: slug || toSlug(name), stateId: state.id } })
    await staffAudit({
      action: "CREATE",
      entity: "District",
      entityId: district.id,
      user: guard.user,
      note: `Created district "${district.name}" in ${state.name}`,
    })
    revalidateLocationPages(state.slug, district.slug)
    return NextResponse.json({ success: true, data: district }, { status: 201 })
  } catch (err) {
    return locationConflictResponse(err, "District") ?? serverError(err, "Failed to create district")
  }
}
