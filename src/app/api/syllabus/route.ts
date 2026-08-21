import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { syllabusSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { contentScope, isAdmin } from "@/lib/roles"
import { notifyUsers } from "@/lib/notifications"
import { sendNotificationSMS } from "@/lib/sms"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")))
    const search = searchParams.get("search") || ""
    const categoryId = searchParams.get("categoryId") || ""
    const departmentId = searchParams.get("departmentId") || ""
    const skip = (page - 1) * limit

    const where: Prisma.SyllabusWhereInput = {}

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

    const [syllabusList, total] = await Promise.all([
      prisma.syllabus.findMany({
        where,
        include: { department: true, category: true, job: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.syllabus.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: syllabusList,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
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

    const { title, slug, description, departmentId, categoryId, jobId, pdfUrl, subjects, status } = validation.data

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
      createdBy: { connect: { id: session.user.id } },
    }

    const syllabus = await prisma.syllabus.create({ data })

    await notifyUsers("SYLLABUS", syllabus.title, syllabus.slug, `New syllabus published: ${syllabus.title}`)
    sendNotificationSMS("SYLLABUS", syllabus.title, syllabus.slug, `New syllabus published: ${syllabus.title}`).catch(console.error)

    return NextResponse.json({ success: true, data: syllabus }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create syllabus" },
      { status: 500 }
    )
  }
}
