import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { admitCardSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { notifyUsers } from "@/lib/notifications"
import { sendNotificationSMS } from "@/lib/sms"
import { contentScope, isAdmin } from "@/lib/roles"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const departmentId = searchParams.get("departmentId") || ""
    const skip = (page - 1) * limit

    const where: Prisma.AdmitCardWhereInput = {}

    if (searchParams.get("scope") === "mine") {
      const session = await auth()
      Object.assign(where, contentScope(session?.user?.role, session?.user?.id))
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { department: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    if (categoryId) where.categoryId = categoryId
    if (departmentId) where.departmentId = departmentId

    const [admitCards, total] = await Promise.all([
      prisma.admitCard.findMany({
        where,
        include: { department: true, category: true, job: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.admitCard.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: admitCards,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
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

    const { title, slug, description, departmentId, categoryId, jobId, examDate, downloadUrl, status } = validation.data

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
      createdBy: { connect: { id: session.user.id } },
    }

    const admitCard = await prisma.admitCard.create({ data })

    await notifyUsers("ADMIT_CARD", admitCard.title, admitCard.slug)
    sendNotificationSMS("ADMIT_CARD", admitCard.title, admitCard.slug).catch(console.error)

    return NextResponse.json({ success: true, data: admitCard }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create admit card" },
      { status: 500 }
    )
  }
}
