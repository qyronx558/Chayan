import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { syllabusSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { isAdmin } from "@/lib/roles"
import { applyContentScope, CREATED_BY_SELECT, scopeErrorStatus } from "@/lib/admin-content"
import { defaultModerationForRole, staffAudit } from "@/lib/moderation"
import { isListTab } from "@/lib/admin/access"
import { notifyUsers } from "@/lib/notifications"
import { sendNotificationSMS } from "@/lib/sms"
import { publicApiResponse, revalidatePublicContent } from "@/lib/cache"
import { normalizeOptionalId, normalizeRequiredId, normalizeOptionalText, findMissingRelation, missingRelationResponse, prismaRelationErrorResponse } from "@/lib/relations"
import { CANDIDATE_POOL_SIZE } from "@/lib/trending/config"
import { rankCandidateList, type AnyItem } from "@/lib/trending/rank"
import { parsePostedWithin, postedSince } from "@/lib/listing-filters"

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
    const subject = searchParams.get("subject") || ""
    const hasPdf = searchParams.get("hasPdf") === "1"
    const postedWithin = parsePostedWithin(searchParams.get("postedWithin"))
    const skip = (page - 1) * limit

    const where: Prisma.SyllabusWhereInput = {}

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
        { subjects: { contains: search, mode: "insensitive" } },
      ]
    }

    if (categoryId) where.categoryId = categoryId
    if (departmentId) where.departmentId = departmentId
    if (subject) where.subjects = { contains: subject, mode: "insensitive" }
    if (hasPdf) where.pdfUrl = { not: null }
    if (postedWithin > 0) where.createdAt = { gte: postedSince(postedWithin) }

    const baseWhere: Prisma.SyllabusWhereInput = { ...where }

    const orderBy: Prisma.SyllabusOrderByWithRelationInput = { createdAt: sort === "oldest" ? "asc" : "desc" }

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
        prisma.syllabus.findMany({
          where,
          include: { department: true, category: true, job: true },
          orderBy,
          take: CANDIDATE_POOL_SIZE,
        }),
        prisma.syllabus.count({ where }),
      ])
      const { ranked, fallback, windowDays } = await rankCandidateList("syllabus", pool as unknown as AnyItem[])
      const payload = {
        success: true,
        data: ranked.slice(skip, skip + limit).map((r) => r.item),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        trending: { fallback, windowDays },
      }
      return publicApiResponse(payload, "gov")
    }

    const [syllabusList, total] = await Promise.all([
      prisma.syllabus.findMany({
        where,
        include: { department: true, category: true, job: true, ...CREATED_BY_SELECT },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.syllabus.count({ where }),
    ])

    let counts: { all: number; published: number; needsReview: number; draft: number; rejected: number } | undefined
    if (isAdminScope && includeCounts) {
      const mine = session?.user ? { createdById: session.user.id } : {}
      const [all, published, needsReview, draft, rejected] = await Promise.all([
        prisma.syllabus.count({ where: baseWhere }),
        prisma.syllabus.count({ where: { ...baseWhere, moderation: "APPROVED" } }),
        prisma.syllabus.count({ where: { ...baseWhere, moderation: "PENDING" } }),
        prisma.syllabus.count({ where: { ...baseWhere, moderation: "PENDING", ...mine } }),
        prisma.syllabus.count({ where: { ...baseWhere, moderation: "REJECTED" } }),
      ])
      counts = { all, published, needsReview, draft, rejected }
    }

    const payload = {
      success: true,
      data: syllabusList,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      ...(counts ? { counts } : {}),
    }
    return isAdminScope ? NextResponse.json(payload) : publicApiResponse(payload, "gov")
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch syllabus" },
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
    const validation = syllabusSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, slug, description, departmentId: rawDepartmentId, categoryId: rawCategoryId, jobId: rawJobId, pdfUrl, subjects, status: rawStatus } = validation.data

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

    const data: Prisma.SyllabusCreateInput = {
      title,
      slug,
      ...(description !== undefined && description !== null ? { description } : {}),
      department: { connect: { id: departmentId } },
      category: { connect: { id: categoryId } },
      ...(jobId ? { job: { connect: { id: jobId } } } : {}),
      ...(pdfUrl !== undefined && pdfUrl !== null ? { pdfUrl } : {}),
      ...(subjects !== undefined && subjects !== null ? { subjects } : {}),
      ...(status !== undefined && status !== null ? { status } : {}),
      moderation: defaultModerationForRole(session.user.role),
      ...(session.user.role === "SUPER_ADMIN"
        ? { reviewedById: session.user.id, reviewedAt: new Date() }
        : {}),
      createdBy: { connect: { id: session.user.id } },
    }

    const syllabus = await prisma.syllabus.create({ data })
    await staffAudit({
      action: "CREATE",
      entity: "Syllabus",
      entityId: syllabus.id,
      user: session.user,
      note: `Created "${syllabus.title}" moderation=${syllabus.moderation}`,
    })
    revalidatePublicContent("syllabus", syllabus.slug)

    // Notify subscribers only for approved (live) content; pending items notify on approval.
    if (syllabus.moderation === "APPROVED") {
      await notifyUsers("SYLLABUS", syllabus.title, syllabus.slug, `New syllabus published: ${syllabus.title}`)
      sendNotificationSMS("SYLLABUS", syllabus.title, syllabus.slug, `New syllabus published: ${syllabus.title}`).catch(console.error)
    }

    return NextResponse.json({ success: true, data: syllabus }, { status: 201 })
  } catch (error) {
    const friendly = prismaRelationErrorResponse(error)
    if (friendly) return friendly
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create syllabus" },
      { status: 500 }
    )
  }
}
