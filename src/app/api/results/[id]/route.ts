import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resultSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { isAdmin } from "@/lib/roles"
import { staffAudit } from "@/lib/moderation"
import { requireAction } from "@/lib/admin/access"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await prisma.result.findUnique({
      where: { id },
      include: { department: true, category: true, job: true },
    })

    if (!result) {
      return NextResponse.json({ success: false, error: "Result not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch result" },
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
    const existing = await prisma.result.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Result not found" }, { status: 404 })
    }
    if (session.user.role === "ADMIN" && existing.createdById !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validation = resultSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, slug, description, departmentId, categoryId, jobId, pdfUrl, resultDate, status } = validation.data

    const data: Prisma.ResultUpdateInput = {
      title,
      slug,
      ...(description !== undefined ? { description } : {}),
      department: { connect: { id: departmentId } },
      category: { connect: { id: categoryId } },
      ...(jobId ? { job: { connect: { id: jobId } } } : { job: { disconnect: true } }),
      ...(pdfUrl !== undefined ? { pdfUrl } : {}),
      ...(resultDate !== undefined ? { resultDate } : {}),
      ...(status !== undefined ? { status } : {}),
    }

    if (session.user.role === "ADMIN") {
      Object.assign(data, { moderation: "PENDING", reviewedById: null, reviewedAt: null, reviewNote: null })
    }

    const result = await prisma.result.update({ where: { id }, data })
    await staffAudit({
      action: "UPDATE",
      entity: "Result",
      entityId: id,
      user: session.user,
      note: `Updated "${result.title}"`,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update result" },
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

    try {
      requireAction(session.user.role, "Result", "delete")
    } catch {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.result.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Result not found" }, { status: 404 })
    }

    // Bookmarks reference results with no onDelete cascade - clear them first.
    await prisma.$transaction([
      prisma.bookmark.deleteMany({ where: { resultId: id } }),
      prisma.result.delete({ where: { id } }),
    ])
    await staffAudit({
      action: "DELETE",
      entity: "Result",
      entityId: id,
      user: session.user,
      note: `Deleted "${existing.title}"`,
    })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete result" },
      { status: 500 }
    )
  }
}
