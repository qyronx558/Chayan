import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { privateJobSchema } from "@/lib/validations"
import { isAdmin } from "@/lib/roles"
import { applyContentScope, CREATED_BY_SELECT, scopeErrorStatus } from "@/lib/admin-content"
import { defaultModerationForRole, writeAuditLog } from "@/lib/moderation"
import { isListTab } from "@/lib/admin/access"
import { findOrCreateCompany } from "@/lib/companies"
import { notifyUsers } from "@/lib/notifications"
import { sendNotificationSMS } from "@/lib/sms"
import { publicApiResponse, revalidatePublicContent } from "@/lib/cache"
import { computeTrustScore } from "@/lib/private-jobs-trust"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "12")))
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || ""
    const status = searchParams.get("status") || ""
    const companyId = searchParams.get("companyId") || ""
    const location = searchParams.get("location") || ""
    const remote = searchParams.get("remote") || ""
    const minSalary = parseInt(searchParams.get("minSalary") || "0") || 0
    const exp = searchParams.get("exp") || ""
    const fresher = searchParams.get("fresher") || ""
    const walkin = searchParams.get("walkin") || ""
    const skill = searchParams.get("skill") || ""
    const sort = searchParams.get("sort") || "new"
    const tab = searchParams.get("tab") || ""
    const includeCounts = searchParams.get("includeCounts") === "1"
    const skip = (page - 1) * limit

    const where: Prisma.PrivateJobWhereInput = {}

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
        { title: { contains: search, mode: "insensitive" as const } },
        { company: { name: { contains: search, mode: "insensitive" as const } } },
        { skills: { has: search } },
      ]
    }
    if (type && type !== "all") where.type = type as Prisma.PrivateJobWhereInput["type"]
    if (status) where.status = status
    if (companyId && companyId !== "all") where.companyId = companyId
    if (location && location !== "all") where.location = { contains: location, mode: "insensitive" }
    if (remote && remote !== "all") where.remotePolicy = remote as Prisma.PrivateJobWhereInput["remotePolicy"]
    if (minSalary > 0) where.salaryMax = { gte: minSalary }
    if (exp) {
      const yrs = parseInt(exp)
      if (!isNaN(yrs)) where.AND = [{ OR: [{ expMax: null }, { expMax: { gte: yrs } }] }]
    }
    if (fresher === "1") where.isFresherFriendly = true
    if (walkin === "1") where.isWalkIn = true
    if (skill && skill !== "all") where.skills = { has: skill }

    const baseWhere: Prisma.PrivateJobWhereInput = { ...where }

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

    const orderBy =
      sort === "salary" ? [{ salaryMax: "desc" as const }, { createdAt: "desc" as const }] :
      sort === "trust" ? [{ trustScore: "desc" as const }, { createdAt: "desc" as const }] :
      [{ createdAt: "desc" as const }]

    const [items, total] = await Promise.all([
      prisma.privateJob.findMany({
        where,
        include: { company: true, ...CREATED_BY_SELECT },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.privateJob.count({ where }),
    ])

    let counts: { all: number; published: number; needsReview: number; draft: number; rejected: number } | undefined
    if (isAdminScope && includeCounts) {
      const mine = session?.user ? { createdById: session.user.id } : {}
      const [all, published, needsReview, draft, rejected] = await Promise.all([
        prisma.privateJob.count({ where: baseWhere }),
        prisma.privateJob.count({ where: { ...baseWhere, moderation: "APPROVED" } }),
        prisma.privateJob.count({ where: { ...baseWhere, moderation: "PENDING" } }),
        prisma.privateJob.count({ where: { ...baseWhere, moderation: "PENDING", ...mine } }),
        prisma.privateJob.count({ where: { ...baseWhere, moderation: "REJECTED" } }),
      ])
      counts = { all, published, needsReview, draft, rejected }
    }

    const payload = {
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      ...(counts ? { counts } : {}),
    }
    return isAdminScope ? NextResponse.json(payload) : publicApiResponse(payload)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch private jobs" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = privateJobSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }

    const { companyId, companyName, skills, isFresherFriendly, isWalkIn, ...rest } = validation.data
    const company = companyName ? await findOrCreateCompany(companyName) : await prisma.company.findUnique({ where: { id: companyId! } })
    const trust = computeTrustScore({
      applicationUrl: rest.applicationUrl,
      applicationEmail: rest.applicationEmail,
      proofUrl: rest.proofUrl,
      companyWebsite: company?.website,
      companyVerified: company?.verifiedStatus === "VERIFIED",
      description: rest.description,
    })
    const job = await prisma.privateJob.create({
      data: {
        ...rest,
        ...(isFresherFriendly != null ? { isFresherFriendly } : {}),
        ...(isWalkIn != null ? { isWalkIn } : {}),
        skills: skills ?? [],
        trustScore: trust.score,
        moderation: defaultModerationForRole(session.user.role),
        ...(session.user.role === "SUPER_ADMIN"
          ? { reviewedById: session.user.id, reviewedAt: new Date() }
          : {}),
        company: { connect: { id: company ? company.id : companyId } },
        createdBy: { connect: { id: session.user.id } },
      },
    })
    await writeAuditLog({
      action: "CREATE",
      entity: "PrivateJob",
      entityId: job.id,
      userId: session.user.id,
      details: `Created by ${session.user.email} (${session.user.id}) moderation=${job.moderation}`,
    })
    revalidatePublicContent("private-job", job.slug)

    // Notify subscribers only for approved (live) content; pending items notify on approval.
    if (job.moderation === "APPROVED") {
      await notifyUsers("PRIVATE_JOB", job.title, job.slug, `New private job posted: ${job.title}`)
      sendNotificationSMS("PRIVATE_JOB", job.title, job.slug, `New private job posted: ${job.title}`).catch(console.error)
    }

    return NextResponse.json({ success: true, data: job }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create private job" },
      { status: 500 }
    )
  }
}
