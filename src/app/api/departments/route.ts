import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { departmentSchema } from "@/lib/validations"
import { isAdmin } from "@/lib/roles"

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { job: true, result: true, admitCard: true, answerKey: true, admission: true, syllabus: true },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    })
    return NextResponse.json({ success: true, data: departments })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch departments" },
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
    const validation = departmentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const department = await prisma.department.create({
      data: {
        ...validation.data,
        createdBy: { connect: { id: session.user.id } },
      },
    })

    return NextResponse.json({ success: true, data: department }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error as Error & { code?: string }).code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A department with this name or slug already exists" },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to create department" },
      { status: 500 }
    )
  }
}
