import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { admitCardSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { notifyUsers } from "@/lib/notifications"
import { sendNotificationSMS } from "@/lib/sms"
import { isAdmin } from "@/lib/roles"
import { applyContentScope, CREATED_BY_SELECT, scopeErrorStatus } from "@/lib/admin-content"
import { defaultModerationForRole, staffAudit } from "@/lib/moderation"
import { isListTab } from "@/lib/admin/access"
import { publicApiResponse, revalidatePublicContent } from "@/lib/cache"
import { normalizeOptionalId, normalizeRequiredId, normalizeOptionalText, findMissingRelation, missingRelationResponse, prismaRelationErrorResponse } from "@/lib/relations"
import { CANDIDATE_POOL_SIZE } from "@/lib/trending/config"
import { rankCandidateList, type AnyItem } from "@/lib/trending/rank"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const departmentId = searchParams.get("departmentId") || ""
    const tab = searchParams.get("tab") || ""
    const includeCounts = searchParams.get("includeCounts") === "1"
    const sort = searchParams.get("sort") || "latest"
    const skip = (page - 1) * limit

    const where: Prisma.AdmitCardWhereInput = {}

    let isAdminScope = false
    try {
      ;({ isAdminScope } = await applyContentScope(where, searchParams))
    } catch (e) {
      return NextResponse.json(
        { success: false, error: e instanceof Error ? e.message : "Forbidden" },
        { status: scopeErrorStatus(e) }
      )
    }

    if (tab && !isListTab(tab)) {
      return NextResponse.json({ success: false, error: "Invalid tab" }, { status: 400 })
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { department: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    if (categoryId) where.categoryId = categoryId
    if (departmentId) where.departmentId = departmentId

    const baseWhere: Prisma.AdmitCardWhereInput = { ...where }

    const session = isAdminScope && (includeCounts || tab === "draft") ? await auth() : null

    if (isAdminScope && tab && tab !== "all") {
      if (tab === "published") where.moderation = "APPROVED"
      else if (tab === "needs") where.moderation = "PENDING"
      else if (tab === "rejected") where.moderation = "REJECTED"
      else if (tab === "draft") {
        if (!session?.user) {
          return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }
        where.moderation = "PENDING"
        where.createdById = session.user.id
      }
    }

    if (sort === "trending" && !isAdminScope) {
      const [pool, total] = await Promise.all([
        prisma.admitCard.findMany({
          where,
          include: { department: true, category: true, job: true },
          orderBy: { createdAt: "desc" },
          take: CANDIDATE_POOL_SIZE,
        }),
        prisma.admitCard.count({ where }),
      ])
      const { ranked, fallback, windowDays } = await rankCandidateList("admit-cards", pool as unknown as AnyItem[])
      const payload = {
        success: true,
        data: ranked.slice(skip, skip + limit).map((r) => r.item),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        trending: { fallback, windowDays },
      }
      return publicApiResponse(payload)
    }

    const [admitCards, total] = await Promise.all([
      prisma.admitCard.findMany({
        where,
        include: { department: true, category: true, job: true, ...CREATED_BY_SELECT },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.admitCard.count({ where }),
    ])

    let counts: { all: number; published: number; needsReview: number; draft: number; rejected: number } | undefined
    if (isAdminScope && includeCounts) {
      const mine = session?.user ? { createdById: session.user.id } : {}
      const [all, published, needsReview, draft, rejected] = await Promise.all([
        prisma.admitCard.count({ where: baseWhere }),
        prisma.admitCard.count({ where: { ...baseWhere, moderation: "APPROVED" } }),
        prisma.admitCard.count({ where: { ...baseWhere, moderation: "PENDING" } }),
        prisma.admitCard.count({ where: { ...baseWhere, moderation: "PENDING", ...mine } }),
        prisma.admitCard.count({ where: { ...baseWhere, moderation: "REJECTED" } }),
      ])
      counts = { all, published, needsReview, draft, rejected }
    }

    const payload = {
      success: true,
      data: admitCards,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      ...(counts ? { counts } : {}),
    }
    return isAdminScope ? NextResponse.json(payload) : publicApiResponse(payload)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch admit cards" },
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
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validation = admitCardSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, slug, description, departmentId: rawDepartmentId, categoryId: rawCategoryId, jobId: rawJobId, examDate, downloadUrl, status: rawStatus } = validation.data

    const departmentId = normalizeRequiredId(rawDepartmentId)
    const categoryId = normalizeRequiredId(rawCategoryId)
    const jobId = normalizeOptionalId(rawJobId)
    const status = normalizeOptionalText(rawStatus)

    if (!departmentId) {
      return NextResponse.json({ success: false, error: "Department is required" }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 })
    }

    const missing = await findMissingRelation({ departmentId, categoryId, jobId })
    if (missing) return missingRelationResponse(missing)

    const data: Prisma.AdmitCardCreateInput = {
      title,
      slug,
      ...(description !== undefined && description !== null ? { description } : {}),
      department: { connect: { id: departmentId } },
      category: { connect: { id: categoryId } },
      ...(jobId ? { job: { connect: { id: jobId } } } : {}),
      ...(examDate !== undefined && examDate !== null ? { examDate } : {}),
      ...(downloadUrl !== undefined && downloadUrl !== null ? { downloadUrl } : {}),
      ...(status !== undefined && status !== null ? { status } : {}),
      moderation: defaultModerationForRole(session.user.role),
      ...(session.user.role === "SUPER_ADMIN"
        ? { reviewedById: session.user.id, reviewedAt: new Date() }
        : {}),
      createdBy: { connect: { id: session.user.id } },
    }

    const admitCard = await prisma.admitCard.create({ data })
    await staffAudit({
      action: "CREATE",
      entity: "AdmitCard",
      entityId: admitCard.id,
      user: session.user,
      note: `Created "${admitCard.title}" moderation=${admitCard.moderation}`,
    })
    revalidatePublicContent("admit-card", admitCard.slug)

    // Notify subscribers only for approved (live) content; pending items notify on approval.
    if (admitCard.moderation === "APPROVED") {
      await notifyUsers("ADMIT_CARD", admitCard.title, admitCard.slug)
      sendNotificationSMS("ADMIT_CARD", admitCard.title, admitCard.slug).catch(console.error)
    }

    return NextResponse.json({ success: true, data: admitCard }, { status: 201 })
  } catch (error) {
    const friendly = prismaRelationErrorResponse(error)
    if (friendly) return friendly
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create admit card" },
      { status: 500 }
    )
  }
}
