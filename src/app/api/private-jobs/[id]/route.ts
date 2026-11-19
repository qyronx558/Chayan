import { cleanJobDescription } from "@/lib/private-jobs/description"
import { normalizeJobSalary } from "@/lib/private-jobs/salary"
import { normalizeJobGeo } from "@/lib/private-jobs/geo"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { privateJobSchema } from "@/lib/validations"
import { findOrCreateCompany } from "@/lib/companies"
import { isAdmin } from "@/lib/roles"
import { Prisma } from "@prisma/client"
import { writeAuditLog } from "@/lib/moderation"
import { getPrivateJobScope, revalidatePrivateJobById, revalidateScoped } from "@/lib/revalidate-content"
import { computeTrustScore } from "@/lib/private-jobs-trust"
import { dedupeHash } from "@/lib/private-jobs/normalize"
import { canViewContent } from "@/lib/public-visibility"
import { normalizeOptionalId, findMissingRelation, missingRelationResponse, prismaRelationErrorResponse } from "@/lib/relations"
import { noStoreResponse, publicApiResponse } from "@/lib/cache"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const job = await prisma.privateJob.findUnique({
      where: { id },
      include: { company: true },
    })
    if (!job) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }
    // Unreviewed or rejected postings are visible only to staff.
    if (!(await canViewContent(job.moderation))) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
    }
    return job.moderation === "APPROVED" ? publicApiResponse({ success: true, data: job }, "private") : noStoreResponse({ success: true, data: job })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch private job" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = privateJobSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }

    const existing = await prisma.privateJob.findUnique({ where: { id }, include: { company: { select: { name: true } } } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Private job not found" }, { status: 404 })
    }
    if (session.user.role === "ADMIN" && existing.createdById !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const { companyId: rawCompanyId, companyName: rawCompanyName, skills, isFresherFriendly, isWalkIn, ...rest } = validation.data
    const normalizedCompanyId = normalizeOptionalId(rawCompanyId)
    const normalizedCompanyName = typeof rawCompanyName === "string" ? rawCompanyName.trim() || undefined : undefined
    const company = normalizedCompanyName
      ? await findOrCreateCompany(normalizedCompanyName)
      : normalizedCompanyId
        ? await prisma.company.findUnique({ where: { id: normalizedCompanyId } })
        : null
    if ((normalizedCompanyId || normalizedCompanyName) && !company) {
      const missing = await findMissingRelation({ companyId: normalizedCompanyId })
      if (missing) return missingRelationResponse(missing)
      return NextResponse.json({ success: false, error: "Selected Company no longer exists. Please refresh and select again." }, { status: 400 })
    }
    // Pasted HTML source / <style> designs are stored as clean markup.
    rest.description = cleanJobDescription(rest.description) ?? rest.description
    // Country (ISO) + canonical city, derived from the location text when not picked.
    normalizeJobGeo(rest)
    normalizeJobSalary(rest, existing.salaryCurrency)
    const trust = computeTrustScore({
      applicationUrl: rest.applicationUrl,
      applicationEmail: rest.applicationEmail,
      proofUrl: (rest as { proofUrl?: string | null }).proofUrl,
      companyWebsite: company?.website,
      companyVerified: company?.verifiedStatus === "VERIFIED",
      description: rest.description,
    })
    const { isFresherFriendly: _ff, isWalkIn: _wi, ...restClean } = rest as Record<string, unknown>
    const data: Prisma.PrivateJobUpdateInput = {
      ...(restClean as Prisma.PrivateJobUpdateInput),
      ...(isFresherFriendly !== undefined && isFresherFriendly !== null ? { isFresherFriendly } : {}),
      ...(isWalkIn !== undefined && isWalkIn !== null ? { isWalkIn } : {}),
      ...(skills !== undefined ? { skills: skills ?? [] } : {}),
      trustScore: trust.score,
      dedupeHash: dedupeHash(company?.name ?? existing.company.name, rest.title ?? existing.title, rest.location ?? existing.location),
      ...(company ? { company: { connect: { id: company.id } } } : {}),
    }
    // Keep closedAt in step with a manual status change.
    if (rest.status && rest.status !== existing.status) {
      data.closedAt = rest.status === "ACTIVE" ? null : new Date()
      if (rest.status === "ACTIVE") data.feedMisses = 0
    }

    if (session.user.role === "ADMIN") {
      data.moderation = "PENDING"
      data.reviewedById = null
      data.reviewedAt = null
      data.reviewNote = null
    }

    const previous = await getPrivateJobScope(id)
    const job = await prisma.privateJob.update({
      where: { id },
      data,
    })
    await revalidatePrivateJobById(id, previous)

    await writeAuditLog({
      action: "UPDATE",
      entity: "PrivateJob",
      entityId: id,
      userId: session.user.id,
      details: `Updated by ${session.user.email} (${session.user.id})`,
    })

    return NextResponse.json({ success: true, data: job })
  } catch (error) {
    const friendly = prismaRelationErrorResponse(error)
    if (friendly) return friendly
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update private job" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.privateJob.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Private job not found" }, { status: 404 })
    }
    if (session.user.role === "ADMIN" && existing.createdById !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const previous = await getPrivateJobScope(id)
    // Clear dependent rows (bookmarks have no cascade; new tables cascade but be explicit).
    await prisma.$transaction([
      prisma.bookmark.deleteMany({ where: { privateJobId: id } }),
      prisma.privateApplication.deleteMany({ where: { privateJobId: id } }),
      prisma.privateJobView.deleteMany({ where: { privateJobId: id } }),
      prisma.jobReport.deleteMany({ where: { privateJobId: id } }),
      prisma.privateJob.delete({ where: { id } }),
    ])
    revalidateScoped("private-job", null, previous)

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete private job" },
      { status: 500 }
    )
  }
}
