import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { privateJobSchema } from "@/lib/validations"
import { isAdmin } from "@/lib/roles"
import { applyContentScope, CREATED_BY_SELECT, scopeErrorStatus } from "@/lib/admin-content"
import { defaultModerationForRole, writeAuditLog } from "@/lib/moderation"
import { findOrCreateCompany } from "@/lib/companies"
import { notifyUsers } from "@/lib/notifications"
import { sendNotificationSMS } from "@/lib/sms"
import { publicApiResponse, revalidatePublicContent } from "@/lib/cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")))
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || ""
    const status = searchParams.get("status") || ""
    const companyId = searchParams.get("companyId") || ""
    const location = searchParams.get("location") || ""
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    let isAdminScope = false
    try {
      ;({ isAdminScope } = await applyContentScope(where, searchParams))
    } catch (e) {
      return NextResponse.json(
        { success: false, error: e instanceof Error ? e.message : "Forbidden" },
        { status: scopeErrorStatus(e) }
      )
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" as const } },
        { company: { name: { contains: search, mode: "insensitive" as const } } },
      ]
    }
    if (type) where.type = type
    if (status) where.status = status
    if (companyId) where.companyId = companyId
    if (location) where.location = { contains: location, mode: "insensitive" as const }

    const [items, total] = await Promise.all([
      prisma.privateJob.findMany({
        where,
        include: { company: true, ...CREATED_BY_SELECT },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.privateJob.count({ where }),
    ])

    const payload = {
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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

    const { companyId, companyName, ...rest } = validation.data
    const company = companyName ? await findOrCreateCompany(companyName) : null
    const job = await prisma.privateJob.create({
      data: {
        ...rest,
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
