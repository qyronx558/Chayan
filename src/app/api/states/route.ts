import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isSuperAdmin } from "@/lib/roles"
import { INDIAN_STATES_28 } from "@/lib/states"
import { stateSchema } from "@/lib/validations"
import { toSlug } from "@/lib/locations"
import { publicApiResponse, revalidateLocationPages } from "@/lib/cache"
import { staffAudit } from "@/lib/moderation"
import { locationConflictResponse, requireSuperAdmin, serverError } from "@/lib/location-api"

/**
 * GET /api/states
 *   Public list of states + union territories with district counts.
 *   ?withJobCounts=1 adds `jobCount` (live, approved state/district jobs).
 *   ?all=1 (super-admin only) also returns legacy rows that have no districts.
 */
export async function GET(request?: NextRequest) {
  try {
    const params = request ? new URL(request.url).searchParams : new URLSearchParams()
    const wantAll = params.get("all") === "1"
    const withJobCounts = params.get("withJobCounts") === "1"

    let where: Prisma.StateWhereInput = { districts: { some: {} } }
    if (wantAll) {
      const session = await auth()
      if (!isSuperAdmin(session?.user?.role)) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
      }
      where = {}
    } else if ((await prisma.district.count()) === 0) {
      // Before the location seed has run, keep the old 28-state list so the
      // site keeps working (legacy/imported junk rows stay hidden).
      where = { name: { in: [...INDIAN_STATES_28] } }
    }

    const states = await prisma.state.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        _count: { select: { districts: true, ...(wantAll ? { job: true } : {}) } },
      },
    })

    let jobCounts = new Map<string, number>()
    if (withJobCounts) {
      const rows = await prisma.job.groupBy({
        by: ["stateId"],
        where: { status: { not: "EXPIRED" }, moderation: "APPROVED", jobLevel: { in: ["STATE", "DISTRICT"] } },
        _count: { _all: true },
      })
      jobCounts = new Map(rows.filter((r) => r.stateId).map((r) => [r.stateId as string, r._count._all]))
    }

    const data = states.map(({ _count, ...s }) => ({
      ...s,
      districtCount: _count.districts,
      ...(wantAll ? { jobCount: (_count as { job?: number }).job ?? 0 } : {}),
      ...(withJobCounts ? { activeJobCount: jobCounts.get(s.id) ?? 0 } : {}),
    }))
    const body = { success: true, data }
    return wantAll ? NextResponse.json(body) : publicApiResponse(body, 300)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch states" },
      { status: 500 }
    )
  }
}

/** POST /api/states - super-admin only. */
export async function POST(request: NextRequest) {
  const guard = await requireSuperAdmin()
  if (!guard.ok) return guard.response
  try {
    const validation = stateSchema.safeParse(await request.json())
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }
    const { name, slug, type } = validation.data
    const state = await prisma.state.create({ data: { name, slug: slug || toSlug(name), type } })
    await staffAudit({ action: "CREATE", entity: "State", entityId: state.id, user: guard.user, note: `Created state "${state.name}"` })
    revalidateLocationPages()
    return NextResponse.json({ success: true, data: state }, { status: 201 })
  } catch (err) {
    return locationConflictResponse(err, "State") ?? serverError(err, "Failed to create state")
  }
}
