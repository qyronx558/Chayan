import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { reviewActionSchema } from "@/lib/validations"
import {
  REVIEWABLE_META,
  isModerationStatus,
  isReviewableEntity,
  reviewContent,
} from "@/lib/moderation"

/**
 * Super-admin content verification queue - ADMIN uploads only (never SUPER_ADMIN's own).
 * Reviewed items leave the queue: default moderation=PENDING.
 * - GET ?entity=Job&moderation=PENDING&createdById=<admin CUID>&search=&page=&limit=&onlyAdmins=true
 *   entity=single type (default Job). SUPER_ADMIN only.
 * - POST { entity, id, action: APPROVE|REJECT, note? } - approve/reject with audit log.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: super admin only" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const entityParam = searchParams.get("entity") || "Job"
    if (!isReviewableEntity(entityParam)) {
      return NextResponse.json({ success: false, error: "Invalid entity" }, { status: 400 })
    }
    const moderationParam = searchParams.get("moderation") || ""
    if (moderationParam && !isModerationStatus(moderationParam)) {
      return NextResponse.json({ success: false, error: "Invalid moderation filter" }, { status: 400 })
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const search = searchParams.get("search") || ""
    const createdById = searchParams.get("createdById") || ""
    // Verification queue shows only ADMIN-uploaded content by default.
    const onlyAdmins = searchParams.get("onlyAdmins") !== "false"
    const skip = (page - 1) * limit

    const meta = REVIEWABLE_META[entityParam]
    const delegate = (prisma as unknown as Record<string, {
      findMany: (a: unknown) => Promise<unknown[]>
      count: (a: unknown) => Promise<number>
    }>)[meta.delegate]

    const where: Record<string, unknown> = {}
    if (moderationParam) where.moderation = moderationParam
    if (createdById) where.createdById = createdById
    if (onlyAdmins) where.createdBy = { role: "ADMIN" }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ]
    }

    const [items, total] = await Promise.all([
      delegate.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      delegate.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch review queue" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: super admin only" }, { status: 403 })
    }

    const body = await request.json()
    const validation = reviewActionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { entity, id, action, note } = validation.data
    try {
      const updated = await reviewContent({
        entity,
        id,
        action,
        note: note ?? null,
        reviewerId: session.user.id,
        reviewerRole: session.user.role,
      })
      return NextResponse.json({ success: true, data: updated })
    } catch (e) {
      const status = (e as Error & { status?: number }).status ?? 500
      return NextResponse.json(
        { success: false, error: e instanceof Error ? e.message : "Review failed" },
        { status }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Review failed" },
      { status: 500 }
    )
  }
}
