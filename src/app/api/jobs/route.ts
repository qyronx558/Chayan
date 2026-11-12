import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { jobSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { notifyUsers } from "@/lib/notifications"
import { sendNotificationSMS } from "@/lib/sms"
import { isAdmin } from "@/lib/roles"
import { applyContentScope, CREATED_BY_SELECT, scopeErrorStatus } from "@/lib/admin-content"
import { defaultModerationForRole, staffAudit } from "@/lib/moderation"
import { isListTab } from "@/lib/admin/access"
import { publicApiResponse, revalidatePublicContent } from "@/lib/cache"
import { normalizeOptionalId, normalizeRequiredId, findMissingRelation, missingRelationResponse, prismaRelationErrorResponse } from "@/lib/relations"
import { CANDIDATE_POOL_SIZE } from "@/lib/trending/config"
import { rankCandidateList, type AnyItem } from "@/lib/trending/rank"
import { buildJobLocationWhere, findDistrictIdByName, validateJobLocation } from "@/lib/locations-server"
import { buildDateRange, dateInDays, parseNumber, parsePostedWithin, postedSince } from "@/lib/listing-filters"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const departmentId = searchParams.get("departmentId") || ""
    const stateId = searchParams.get("stateId") || ""
    const status = searchParams.get("status") || ""
    const qualification = searchParams.get("qualification") || ""
    const minVacancies = parseNumber(searchParams.get("minVacancies"), 0)
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")
    const postedWithin = parsePostedWithin(searchParams.get("postedWithin"))
    const closingSoon = searchParams.get("closingSoon") === "1"
    const hasApplyLink = searchParams.get("hasApplyLink") === "1"
    const sort = searchParams.get("sort") || "latest"
    const tab = searchParams.get("tab") || ""
    const includeCounts = searchParams.get("includeCounts") === "1"

    const skip = (page - 1) * limit

    const where: Prisma.JobWhereInput = {}

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
        { advertisementNo: { contains: search, mode: "insensitive" } },
        { education: { contains: search, mode: "insensitive" } },
        { department: { name: { contains: search, mode: "insensitive" } } },
        { category: { name: { contains: search, mode: "insensitive" } } },
        { state: { name: { contains: search, mode: "insensitive" } } },
        { district: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    const locationWhere = buildJobLocationWhere(searchParams)
    if (locationWhere.length) where.AND = locationWhere

    if (categoryId) where.categoryId = categoryId
    if (departmentId) where.departmentId = departmentId
    if (stateId) where.stateId = stateId
    if (status) where.status = status as "ACTIVE" | "EXPIRED" | "UPCOMING"
    if (qualification) where.education = { contains: qualification, mode: "insensitive" }
    if (minVacancies > 0) where.totalVacancies = { gte: minVacancies }
    if (hasApplyLink) where.applyLink = { not: null }

    const lastDateRange = buildDateRange(fromDate, toDate)
    const closingRange = closingSoon ? { gte: new Date(), lte: dateInDays(7) } : undefined
    if (lastDateRange || closingRange) {
      where.lastDate = { ...lastDateRange, ...closingRange }
    }
    if (postedWithin > 0) where.createdAt = { gte: postedSince(postedWithin) }

    const baseWhere: Prisma.JobWhereInput = { ...where }

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

    let orderBy: Prisma.JobOrderByWithRelationInput = { createdAt: "desc" }
    switch (sort) {
      case "oldest":
        orderBy = { createdAt: "asc" }
        break
      case "last_date_asc":
        orderBy = { lastDate: "asc" }
        break
      case "last_date_desc":
        orderBy = { lastDate: "desc" }
        break
      case "name_asc":
        orderBy = { title: "asc" }
        break
      case "name_desc":
        orderBy = { title: "desc" }
        break
      case "trending":
        orderBy = { createdAt: "desc" }
        break
      default:
        orderBy = { createdAt: "desc" }
    }

    // Popularity ranking: score a recency pool in-memory, then paginate.
    // Pool is capped (see CANDIDATE_POOL_SIZE) so deep pages fall back to
    // recency order beyond the pool - home only ever needs page 1.
    if (sort === "trending" && !isAdminScope) {
      const [pool, total] = await Promise.all([
        prisma.job.findMany({
          where,
          include: { department: true, category: true, state: true, district: { select: { id: true, name: true, slug: true } } },
          orderBy,
          take: CANDIDATE_POOL_SIZE,
        }),
        prisma.job.count({ where }),
      ])
      const { ranked, fallback, windowDays } = await rankCandidateList("jobs", pool as unknown as AnyItem[])
      const payload = {
        success: true,
        data: ranked.slice(skip, skip + limit).map((r) => r.item),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        trending: { fallback, windowDays },
      }
      return publicApiResponse(payload)
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          department: true,
          category: true,
          state: true,
          district: { select: { id: true, name: true, slug: true } },
          ...CREATED_BY_SELECT,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ])

    let counts: { all: number; published: number; needsReview: number; draft: number; rejected: number } | undefined
    if (isAdminScope && includeCounts) {
      const mine = session?.user ? { createdById: session.user.id } : {}
      const [all, published, needsReview, draft, rejected] = await Promise.all([
        prisma.job.count({ where: baseWhere }),
        prisma.job.count({ where: { ...baseWhere, moderation: "APPROVED" } }),
        prisma.job.count({ where: { ...baseWhere, moderation: "PENDING" } }),
        prisma.job.count({ where: { ...baseWhere, moderation: "PENDING", ...mine } }),
        prisma.job.count({ where: { ...baseWhere, moderation: "REJECTED" } }),
      ])
      counts = { all, published, needsReview, draft, rejected }
    }

    const payload = {
      success: true,
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      ...(counts ? { counts } : {}),
    }
    return isAdminScope ? NextResponse.json(payload) : publicApiResponse(payload)
  } catch (error) {
    console.error("[jobs] Failed to fetch jobs:", error)
    return NextResponse.json(
      { success: false, error: "Unable to load jobs. Please try again shortly." },
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
    const validation = jobSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const {
      title,
      slug,
      departmentId: rawDepartmentId,
      categoryId: rawCategoryId,
      jobLevel: rawJobLevel,
      stateId: rawStateId,
      districtId: rawDistrictId,
      advertisementNo,
      totalVacancies,
      salary,
      location,
      ageLimit,
      ageRelaxation,
      education,
      selectionProcess,
      applicationFee,
      importantDates,
      documentsRequired,
      howToApply,
      officialNotification,
      officialWebsite,
      applyLink,
      status,
      experience,
      startDate,
      lastDate,
    } = validation.data

    // Normalize ids: admin selects use " " / "none" sentinels for "None" -
    // those (and any whitespace-only value) must become null, never connect.
    const departmentId = normalizeRequiredId(rawDepartmentId)
    const categoryId = normalizeRequiredId(rawCategoryId)
    const rawState = normalizeOptionalId(rawStateId)
    let rawDistrict = normalizeOptionalId(rawDistrictId)
    // Bulk import sends the district by name (column "district").
    if (!rawDistrict && rawState && typeof body.districtName === "string" && body.districtName.trim()) {
      rawDistrict = await findDistrictIdByName(rawState, body.districtName)
      if (!rawDistrict) {
        return NextResponse.json({ success: false, error: `District "${body.districtName.trim()}" not found in the selected state` }, { status: 400 })
      }
    }

    if (!departmentId) {
      return NextResponse.json({ success: false, error: "Department is required" }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 })
    }

    const missing = await findMissingRelation({ departmentId, categoryId })
    if (missing) return missingRelationResponse(missing)

    const loc = await validateJobLocation({ jobLevel: rawJobLevel, stateId: rawState, districtId: rawDistrict })
    if (!loc.ok) return NextResponse.json({ success: false, error: loc.error }, { status: 400 })
    const { jobLevel, stateId, districtId } = loc.value

    const data: Prisma.JobCreateInput = {
      title,
      slug,
      department: { connect: { id: departmentId } },
      category: { connect: { id: categoryId } },
      jobLevel,
      ...(stateId ? { state: { connect: { id: stateId } } } : {}),
      ...(districtId ? { district: { connect: { id: districtId } } } : {}),
      ...(advertisementNo !== undefined && advertisementNo !== null ? { advertisementNo } : {}),
      ...(totalVacancies !== undefined && totalVacancies !== null ? { totalVacancies } : {}),
      ...(salary !== undefined && salary !== null ? { salary } : {}),
      ...(location !== undefined && location !== null ? { location } : {}),
      ...(ageLimit !== undefined && ageLimit !== null ? { ageLimit } : {}),
      ...(ageRelaxation !== undefined && ageRelaxation !== null ? { ageRelaxation } : {}),
      ...(education !== undefined && education !== null ? { education } : {}),
      ...(selectionProcess !== undefined && selectionProcess !== null ? { selectionProcess } : {}),
      ...(applicationFee !== undefined && applicationFee !== null ? { applicationFee } : {}),
      ...(importantDates !== undefined && importantDates !== null ? { importantDates } : {}),
      ...(documentsRequired !== undefined && documentsRequired !== null ? { documentsRequired } : {}),
      ...(howToApply !== undefined && howToApply !== null ? { howToApply } : {}),
      ...(officialNotification !== undefined && officialNotification !== null ? { officialNotification } : {}),
      ...(officialWebsite !== undefined && officialWebsite !== null ? { officialWebsite } : {}),
      ...(applyLink !== undefined && applyLink !== null ? { applyLink } : {}),
      ...(experience !== undefined && experience !== null ? { experience } : {}),
      ...(startDate !== undefined && startDate !== null ? { startDate } : {}),
      ...(lastDate !== undefined && lastDate !== null ? { lastDate } : {}),
      status: status || "ACTIVE",
      moderation: defaultModerationForRole(session.user.role),
      ...(session.user.role === "SUPER_ADMIN"
        ? { reviewedById: session.user.id, reviewedAt: new Date() }
        : {}),
      createdBy: { connect: { id: session.user.id } },
    }

    const job = await prisma.job.create({ data })
    await staffAudit({
      action: "CREATE",
      entity: "Job",
      entityId: job.id,
      user: session.user,
      note: `Created "${job.title}" moderation=${job.moderation}`,
    })
    revalidatePublicContent("job", job.slug)

    // Notify subscribers only for approved (live) content; pending items notify on approval.
    if (job.moderation === "APPROVED") {
      await notifyUsers("JOB", job.title, job.slug)
      sendNotificationSMS("JOB", job.title, job.slug).catch(console.error)
    }

    return NextResponse.json({ success: true, data: job }, { status: 201 })
  } catch (error) {
    const friendly = prismaRelationErrorResponse(error)
    if (friendly) return friendly
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create job" },
      { status: 500 }
    )
  }
}
