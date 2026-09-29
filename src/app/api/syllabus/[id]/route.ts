import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { syllabusSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { isAdmin } from "@/lib/roles"
import { writeAuditLog } from "@/lib/moderation"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const syllabus = await prisma.syllabus.findUnique({
      where: { id },
      include: { department: true, category: true, job: true },
    })

    if (!syllabus) {
      return NextResponse.json({ success: false, error: "Syllabus not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: syllabus })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch syllabus" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.syllabus.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Syllabus not found" }, { status: 404 })
    }
    if (session.user.role === "ADMIN" && existing.createdById !== session.user.id) {
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

    const data: Prisma.SyllabusUpdateInput = {
      title,
      slug,
      ...(description !== undefined ? { description } : {}),
      department: { connect: { id: departmentId } },
      category: { connect: { id: categoryId } },
      ...(jobId ? { job: { connect: { id: jobId } } } : { job: { disconnect: true } }),
      ...(pdfUrl !== undefined ? { pdfUrl } : {}),
      ...(subjects !== undefined ? { subjects } : {}),
      ...(status !== undefined ? { status } : {}),
    }

    if (session.user.role === "ADMIN") {
      data.moderation = "PENDING"
      data.reviewedById = null
      data.reviewedAt = null
      data.reviewNote = null
    }

    const updatedSyllabus = await prisma.syllabus.update({ where: { id }, data })

    await writeAuditLog({
      action: "UPDATE",
      entity: "Syllabus",
      entityId: id,
      userId: session.user.id,
      details: `Updated by ${session.user.email} (${session.user.id})`,
    })

    return NextResponse.json({ success: true, data: updatedSyllabus })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update syllabus" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (!isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.syllabus.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Syllabus not found" }, { status: 404 })
    }
    if (session.user.role === "ADMIN" && existing.createdById !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    // Bookmarks reference syllabus rows with no onDelete cascade - clear them first.
    await prisma.$transaction([
      prisma.bookmark.deleteMany({ where: { syllabusId: id } }),
      prisma.syllabus.delete({ where: { id } }),
    ])

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete syllabus" },
      { status: 500 }
    )
  }
}
