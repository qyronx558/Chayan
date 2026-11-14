import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { jobSchema } from "@/lib/validations"
import { Prisma } from "@prisma/client"
import { isAdmin } from "@/lib/roles"
import { revalidatePublicContent } from "@/lib/cache"
import { staffAudit } from "@/lib/moderation"
import { requireAction } from "@/lib/admin/access"
import { validateJobLocation } from "@/lib/locations-server"
import { normalizeOptionalId, normalizeRequiredId, findMissingRelation, missingRelationResponse, prismaRelationErrorResponse } from "@/lib/relations"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const job = await prisma.job.findUnique({
      where: { id },
      include: { department: true, category: true, state: true, district: true },
    })

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: job })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch job" },
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
    const existing = await prisma.job.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    }
    if (session.user.role === "ADMIN" && existing.createdById !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validation = jobSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const {
      title,
      slug,
      departmentId: rawDepartmentId,
      categoryId: rawCategoryId,
      jobLevel: rawJobLevel,
      stateId: rawStateId,
      districtId: rawDistrictId,
      advertisementNo,
      totalVacancies,
      salary,
      location,
      ageLimit,
      ageRelaxation,
      education,
      selectionProcess,
      applicationFee,
      importantDates,
      documentsRequired,
      howToApply,
      officialNotification,
      officialWebsite,
      applyLink,
      status,
      experience,
      summary,
      startDate,
      lastDate,
    } = validation.data

    const departmentId = normalizeRequiredId(rawDepartmentId)
    const categoryId = normalizeRequiredId(rawCategoryId)

    if (!departmentId) {
      return NextResponse.json({ success: false, error: "Department is required" }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 })
    }

    const missing = await findMissingRelation({ departmentId, categoryId })
    if (missing) return missingRelationResponse(missing)

    const loc = await validateJobLocation({
      jobLevel: rawJobLevel,
      stateId: normalizeOptionalId(rawStateId),
      districtId: normalizeOptionalId(rawDistrictId),
    })
    if (!loc.ok) return NextResponse.json({ success: false, error: loc.error }, { status: 400 })
    const { jobLevel, stateId, districtId } = loc.value

    // Plain FK columns (not nested connect/disconnect) so level, state and
    // district change in ONE UPDATE - Prisma runs each nested disconnect as its
    // own statement, which trips Job_location_level_check halfway through.
    const data: Prisma.JobUncheckedUpdateInput = {
      title,
      slug,
      departmentId,
      categoryId,
      jobLevel,
      stateId,
      districtId,
      ...(advertisementNo !== undefined ? { advertisementNo } : {}),
      ...(totalVacancies !== undefined ? { totalVacancies } : {}),
      ...(salary !== undefined ? { salary } : {}),
      ...(location !== undefined ? { location } : {}),
      ...(ageLimit !== undefined ? { ageLimit } : {}),
      ...(ageRelaxation !== undefined ? { ageRelaxation } : {}),
      ...(education !== undefined ? { education } : {}),
      ...(selectionProcess !== undefined ? { selectionProcess } : {}),
      ...(applicationFee !== undefined ? { applicationFee } : {}),
      ...(importantDates !== undefined ? { importantDates } : {}),
      ...(documentsRequired !== undefined ? { documentsRequired } : {}),
      ...(howToApply !== undefined ? { howToApply } : {}),
      ...(officialNotification !== undefined ? { officialNotification } : {}),
      ...(officialWebsite !== undefined ? { officialWebsite } : {}),
      ...(applyLink !== undefined ? { applyLink } : {}),
      ...(experience !== undefined ? { experience } : {}),
      ...(summary !== undefined ? { summary } : {}),
      ...(startDate !== undefined ? { startDate } : {}),
      ...(lastDate !== undefined ? { lastDate } : {}),
      status: status || "ACTIVE",
    }

    if (session.user.role === "ADMIN") {
      Object.assign(data, { moderation: "PENDING", reviewedById: null, reviewedAt: null, reviewNote: null })
    }

    const job = await prisma.job.update({ where: { id }, data })
    revalidatePublicContent("job", job.slug)
    await staffAudit({
      action: "UPDATE",
      entity: "Job",
      entityId: id,
      user: session.user,
      note: `Updated "${job.title}"`,
    })

    return NextResponse.json({ success: true, data: job })
  } catch (error) {
    const friendly = prismaRelationErrorResponse(error)
    if (friendly) return friendly
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update job" },
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
      requireAction(session.user.role, "Job", "delete")
    } catch {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const existing = await prisma.job.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    }

    // Clear dependents first: Job has no onDelete cascade, so linked
    // views/bookmarks and optional job links would otherwise block the
    // delete with a foreign-key violation.
    await prisma.$transaction([
      prisma.jobView.deleteMany({ where: { jobId: id } }),
      prisma.bookmark.deleteMany({ where: { jobId: id } }),
      prisma.result.updateMany({ where: { jobId: id }, data: { jobId: null } }),
      prisma.admitCard.updateMany({ where: { jobId: id }, data: { jobId: null } }),
      prisma.answerKey.updateMany({ where: { jobId: id }, data: { jobId: null } }),
      prisma.syllabus.updateMany({ where: { jobId: id }, data: { jobId: null } }),
      prisma.job.delete({ where: { id } }),
    ])
    revalidatePublicContent("job", existing.slug)
    await staffAudit({
      action: "DELETE",
      entity: "Job",
      entityId: id,
      user: session.user,
      note: `Deleted "${existing.title}"`,
    })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete job" },
      { status: 500 }
    )
  }
}
