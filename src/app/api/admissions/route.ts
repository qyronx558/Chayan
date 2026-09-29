import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { admissionSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { isAdmin } from "@/lib/roles"
import { applyContentScope, CREATED_BY_SELECT, scopeErrorStatus } from "@/lib/admin-content"
import { defaultModerationForRole, writeAuditLog } from "@/lib/moderation"
import { notifyUsers } from "@/lib/notifications"
import { sendNotificationSMS } from "@/lib/sms"
import { publicApiResponse, revalidatePublicContent } from "@/lib/cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const departmentId = searchParams.get("departmentId") || ""
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

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { department: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    if (categoryId) where.categoryId = categoryId
    if (departmentId) where.departmentId = departmentId

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where,
        include: { department: true, category: true, ...CREATED_BY_SELECT },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.admission.count({ where }),
    ])

    const payload = {
      success: true,
      data: admissions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
    return isAdminScope ? NextResponse.json(payload) : publicApiResponse(payload)
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

    const { title, slug, description, departmentId, categoryId, startDate, lastDate, applicationFee, pdfUrl, status } =
      validation.data

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
    await writeAuditLog({
      action: "CREATE",
      entity: "Admission",
      entityId: admission.id,
      userId: session.user.id,
      details: `Created by ${session.user.email} (${session.user.id}) moderation=${admission.moderation}`,
    })
    revalidatePublicContent("admission", admission.slug)

    // Notify subscribers only for approved (live) content; pending items notify on approval.
    if (admission.moderation === "APPROVED") {
      await notifyUsers("ADMISSION", admission.title, admission.slug, `New admission notification: ${admission.title}`)
      sendNotificationSMS("ADMISSION", admission.title, admission.slug, `New admission notification: ${admission.title}`).catch(console.error)
    }

    return NextResponse.json({ success: true, data: admission }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create admission" },
      { status: 500 }
    )
  }
}
