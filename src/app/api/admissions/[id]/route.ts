import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { admissionSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { isAdmin } from "@/lib/roles"
import { staffAudit } from "@/lib/moderation"
import { requireAction } from "@/lib/admin/access"
import { normalizeRequiredId, normalizeOptionalText, findMissingRelation, missingRelationResponse, prismaRelationErrorResponse } from "@/lib/relations"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admission = await prisma.admission.findUnique({
      where: { id },
      include: { department: true, category: true },
    })

    if (!admission) {
      return NextResponse.json({ success: false, error: "Admission not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: admission })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch admission" },
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
    const existing = await prisma.admission.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Admission not found" }, { status: 404 })
    }
    if (session.user.role === "ADMIN" && existing.createdById !== session.user.id) {
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

    const { title, slug, description, departmentId: rawDepartmentId, categoryId: rawCategoryId, startDate, lastDate, applicationFee, pdfUrl, status: rawStatus } =
      validation.data

    const departmentId = normalizeRequiredId(rawDepartmentId)
    const categoryId = normalizeRequiredId(rawCategoryId)
    const status = normalizeOptionalText(rawStatus)

    if (!departmentId) {
      return NextResponse.json({ success: false, error: "Department is required" }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 })
    }

    const missing = await findMissingRelation({ departmentId, categoryId })
    if (missing) return missingRelationResponse(missing)

    const data: Prisma.AdmissionUpdateInput = {
      title,
      slug,
      ...(description !== undefined ? { description } : {}),
      department: { connect: { id: departmentId } },
      category: { connect: { id: categoryId } },
      ...(startDate !== undefined ? { startDate } : {}),
      ...(lastDate !== undefined ? { lastDate } : {}),
      ...(applicationFee !== undefined ? { applicationFee } : {}),
      ...(pdfUrl !== undefined ? { pdfUrl } : {}),
      ...(status !== undefined ? { status } : {}),
    }

    if (session.user.role === "ADMIN") {
      data.moderation = "PENDING"
      data.reviewedById = null
      data.reviewedAt = null
      data.reviewNote = null
    }

    const admission = await prisma.admission.update({ where: { id }, data })

    await staffAudit({
      action: "UPDATE",
      entity: "Admission",
      entityId: id,
      user: session.user,
      note: `Updated "${admission.title}"`,
    })

    return NextResponse.json({ success: true, data: admission })
  } catch (error) {
    const friendly = prismaRelationErrorResponse(error)
    if (friendly) return friendly
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update admission" },
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
      requireAction(session.user.role, "Admission", "delete")
    } catch {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.admission.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Admission not found" }, { status: 404 })
    }

    await prisma.admission.delete({ where: { id } })
    await staffAudit({
      action: "DELETE",
      entity: "Admission",
      entityId: id,
      user: session.user,
      note: `Deleted "${existing.title}"`,
    })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete admission" },
      { status: 500 }
    )
  }
}
