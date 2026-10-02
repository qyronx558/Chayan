import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { departmentSchema } from "@/lib/validations"
import { isAdmin } from "@/lib/roles"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: { select: { job: true, result: true, admitCard: true, answerKey: true, admission: true, syllabus: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })

    if (!department) {
      return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: department })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch department" },
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
    const existing = await prisma.department.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 })
    }
    // Owner-scoped: ADMINs can only edit departments they uploaded.
    // NULL-createdById rows are system / super-admin owned.
    if (session.user.role === "ADMIN" && existing.createdById !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validation = departmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const department = await prisma.department.update({
      where: { id },
      data: validation.data,
    })

    return NextResponse.json({ success: true, data: department })
  } catch (error) {
    if (error instanceof Error && (error as Error & { code?: string }).code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A department with this name or slug already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update department" },
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
    const existing = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: { select: { job: true, result: true, admitCard: true, answerKey: true, admission: true, syllabus: true } },
      },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 })
    }
    // Owner-scoped: ADMINs can only delete departments they uploaded.
    if (session.user.role === "ADMIN" && existing.createdById !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const inUse =
      existing._count.job +
      existing._count.result +
      existing._count.admitCard +
      existing._count.answerKey +
      existing._count.admission +
      existing._count.syllabus
    if (inUse > 0) {
      return NextResponse.json(
        { success: false, error: `Department is in use by ${inUse} record(s) and cannot be deleted` },
        { status: 409 }
      )
    }

    await prisma.department.delete({ where: { id } })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete department" },
      { status: 500 }
    )
  }
}
