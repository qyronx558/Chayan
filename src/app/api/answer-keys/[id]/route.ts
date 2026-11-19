import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { answerKeySchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { isAdmin } from "@/lib/roles"
import { staffAudit } from "@/lib/moderation"
import { publicApiResponse, revalidatePublicContent } from "@/lib/cache"
import { requireAction } from "@/lib/admin/access"
import { normalizeOptionalId, normalizeRequiredId, normalizeOptionalText, findMissingRelation, missingRelationResponse, prismaRelationErrorResponse } from "@/lib/relations"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const answerKey = await prisma.answerKey.findUnique({
      where: { id },
      include: { department: true, category: true, job: true },
    })

    if (!answerKey) {
      return NextResponse.json({ success: false, error: "Answer key not found" }, { status: 404 })
    }

    return publicApiResponse({ success: true, data: answerKey }, "gov")
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch answer key" },
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
    const existing = await prisma.answerKey.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Answer key not found" }, { status: 404 })
    }
    if (session.user.role === "ADMIN" && existing.createdById !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validation = answerKeySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, slug, description, departmentId: rawDepartmentId, categoryId: rawCategoryId, jobId: rawJobId, pdfUrl, status: rawStatus } = validation.data

    const departmentId = normalizeRequiredId(rawDepartmentId)
    const categoryId = normalizeRequiredId(rawCategoryId)
    const jobId = normalizeOptionalId(rawJobId)
    const status = normalizeOptionalText(rawStatus)

    if (!departmentId) {
      return NextResponse.json({ success: false, error: "Department is required" }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 })
    }

    const missing = await findMissingRelation({ departmentId, categoryId, jobId })
    if (missing) return missingRelationResponse(missing)

    const data: Prisma.AnswerKeyUpdateInput = {
      title,
      slug,
      ...(description !== undefined ? { description } : {}),
      department: { connect: { id: departmentId } },
      category: { connect: { id: categoryId } },
      ...(jobId ? { job: { connect: { id: jobId } } } : { job: { disconnect: true } }),
      ...(pdfUrl !== undefined ? { pdfUrl } : {}),
      ...(status !== undefined ? { status } : {}),
    }

    if (session.user.role === "ADMIN") {
      Object.assign(data, { moderation: "PENDING", reviewedById: null, reviewedAt: null, reviewNote: null })
    }

    const answerKey = await prisma.answerKey.update({ where: { id }, data })
    await staffAudit({
      action: "UPDATE",
      entity: "AnswerKey",
      entityId: id,
      user: session.user,
      note: `Updated "${answerKey.title}"`,
    })

    revalidatePublicContent("answer-key", answerKey.slug)
    if (existing.slug !== answerKey.slug) revalidatePublicContent("answer-key", existing.slug)
    return NextResponse.json({ success: true, data: answerKey })
  } catch (error) {
    const friendly = prismaRelationErrorResponse(error)
    if (friendly) return friendly
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update answer key" },
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
      requireAction(session.user.role, "AnswerKey", "delete")
    } catch {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.answerKey.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Answer key not found" }, { status: 404 })
    }

    await prisma.answerKey.delete({ where: { id } })
    await staffAudit({
      action: "DELETE",
      entity: "AnswerKey",
      entityId: id,
      user: session.user,
      note: `Deleted "${existing.title}"`,
    })

    revalidatePublicContent("answer-key", existing.slug)
    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete answer key" },
      { status: 500 }
    )
  }
}
