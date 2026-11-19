import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { admissionSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { isAdmin } from "@/lib/roles"
import { applyContentScope, CREATED_BY_SELECT, scopeErrorStatus } from "@/lib/admin-content"
import { defaultModerationForRole, staffAudit } from "@/lib/moderation"
import { isListTab } from "@/lib/admin/access"
import { notifyUsers } from "@/lib/notifications"
import { sendNotificationSMS } from "@/lib/sms"
import { publicApiResponse, revalidatePublicContent } from "@/lib/cache"
import { normalizeRequiredId, normalizeOptionalText, findMissingRelation, missingRelationResponse, prismaRelationErrorResponse } from "@/lib/relations"
import { CANDIDATE_POOL_SIZE } from "@/lib/trending/config"
import { rankCandidateList, type AnyItem } from "@/lib/trending/rank"
import { buildDateRange, dateInDays, parsePostedWithin, postedSince } from "@/lib/listing-filters"

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
    const hasPdf = searchParams.get("hasPdf") === "1"
    const openNow = searchParams.get("openNow") === "1"
    const closingSoon = searchParams.get("closingSoon") === "1"
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")
    const postedWithin = parsePostedWithin(searchParams.get("postedWithin"))
    const skip = (page - 1) * limit

    const where: Prisma.AdmissionWhereInput = {}

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
        { category: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    if (categoryId) where.categoryId = categoryId
    if (departmentId) where.departmentId = departmentId
    if (hasPdf) where.pdfUrl = { not: null }
    if (postedWithin > 0) where.createdAt = { gte: postedSince(postedWithin) }

    const lastDateRange = buildDateRange(fromDate, toDate)
    const lastDateFilter: { gte?: Date; lte?: Date } = {}
    if (lastDateRange) Object.assign(lastDateFilter, lastDateRange)
    if (openNow) lastDateFilter.gte = new Date()
    if (closingSoon) {
      lastDateFilter.gte = new Date()
      lastDateFilter.lte = dateInDays(7)
    }
    if (Object.keys(lastDateFilter).length > 0) where.lastDate = lastDateFilter

    const baseWhere: Prisma.AdmissionWhereInput = { ...where }

    const orderBy: Prisma.AdmissionOrderByWithRelationInput[] =
      sort === "oldest"
        ? [{ createdAt: "asc" }]
        : sort === "last_date_asc"
          ? [{ lastDate: "asc" }, { createdAt: "desc" }]
          : sort === "last_date_desc"
            ? [{ lastDate: "desc" }, { createdAt: "desc" }]
            : sort === "start_date_asc"
              ? [{ startDate: "asc" }, { createdAt: "desc" }]
              : [{ createdAt: "desc" }]

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
        prisma.admission.findMany({
          where,
          include: { department: true, category: true },
          orderBy,
          take: CANDIDATE_POOL_SIZE,
        }),
        prisma.admission.count({ where }),
      ])
      const { ranked, fallback, windowDays } = await rankCandidateList("admissions", pool as unknown as AnyItem[])
      const payload = {
        success: true,
        data: ranked.slice(skip, skip + limit).map((r) => r.item),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        trending: { fallback, windowDays },
      }
      return publicApiResponse(payload, "gov")
    }

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where,
        include: { department: true, category: true, ...CREATED_BY_SELECT },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.admission.count({ where }),
    ])

    let counts: { all: number; published: number; needsReview: number; draft: number; rejected: number } | undefined
    if (isAdminScope && includeCounts) {
      const mine = session?.user ? { createdById: session.user.id } : {}
      const [all, published, needsReview, draft, rejected] = await Promise.all([
        prisma.admission.count({ where: baseWhere }),
        prisma.admission.count({ where: { ...baseWhere, moderation: "APPROVED" } }),
        prisma.admission.count({ where: { ...baseWhere, moderation: "PENDING" } }),
        prisma.admission.count({ where: { ...baseWhere, moderation: "PENDING", ...mine } }),
        prisma.admission.count({ where: { ...baseWhere, moderation: "REJECTED" } }),
      ])
      counts = { all, published, needsReview, draft, rejected }
    }

    const payload = {
      success: true,
      data: admissions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      ...(counts ? { counts } : {}),
    }
    return isAdminScope ? NextResponse.json(payload) : publicApiResponse(payload, "gov")
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch admissions" },
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
    const validation = admissionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, slug, description, departmentId: rawDepartmentId, categoryId: rawCategoryId, startDate, lastDate, applicationFee, pdfUrl, status: rawStatus } =
      validation.data

    const departmentId = normalizeRequiredId(rawDepartmentId)
    const categoryId = normalizeRequiredId(rawCategoryId)
    const status = normalizeOptionalText(rawStatus)

    if (!departmentId) {
      return NextResponse.json({ success: false, error: "Department is required" }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 })
    }

    const missing = await findMissingRelation({ departmentId, categoryId })
    if (missing) return missingRelationResponse(missing)

    const data: Prisma.AdmissionCreateInput = {
      title,
      slug,
      ...(description !== undefined && description !== null ? { description } : {}),
      department: { connect: { id: departmentId } },
      category: { connect: { id: categoryId } },
      ...(startDate !== undefined && startDate !== null ? { startDate } : {}),
      ...(lastDate !== undefined && lastDate !== null ? { lastDate } : {}),
      ...(applicationFee !== undefined && applicationFee !== null ? { applicationFee } : {}),
      ...(pdfUrl !== undefined && pdfUrl !== null ? { pdfUrl } : {}),
      ...(status !== undefined && status !== null ? { status } : {}),
      moderation: defaultModerationForRole(session.user.role),
      ...(session.user.role === "SUPER_ADMIN"
        ? { reviewedById: session.user.id, reviewedAt: new Date() }
        : {}),
      createdBy: { connect: { id: session.user.id } },
    }

    const admission = await prisma.admission.create({ data })
    await staffAudit({
      action: "CREATE",
      entity: "Admission",
      entityId: admission.id,
      user: session.user,
      note: `Created "${admission.title}" moderation=${admission.moderation}`,
    })
    revalidatePublicContent("admission", admission.slug)

    // Notify subscribers only for approved (live) content; pending items notify on approval.
    if (admission.moderation === "APPROVED") {
      await notifyUsers("ADMISSION", admission.title, admission.slug, `New admission notification: ${admission.title}`)
      sendNotificationSMS("ADMISSION", admission.title, admission.slug, `New admission notification: ${admission.title}`).catch(console.error)
    }

    return NextResponse.json({ success: true, data: admission }, { status: 201 })
  } catch (error) {
    const friendly = prismaRelationErrorResponse(error)
    if (friendly) return friendly
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create admission" },
      { status: 500 }
    )
  }
}
