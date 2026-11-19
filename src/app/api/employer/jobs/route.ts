import { cleanJobDescription } from "@/lib/private-jobs/description"
import { normalizeJobGeo } from "@/lib/private-jobs/geo"
import { NextRequest, NextResponse } from "next/server"
import { scheduleLogoLookup } from "@/lib/private-jobs/logo"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { privateJobSchema } from "@/lib/validations"
import { computeTrustScore } from "@/lib/private-jobs-trust"
import { dedupeHash } from "@/lib/private-jobs/normalize"
import { slugify } from "@/lib/utils"
import { revalidatePublicContent } from "@/lib/cache"

async function myVerifiedCompanyIds(userId: string) {
  const members = await prisma.companyMember.findMany({
    where: { userId, verified: true },
    select: { companyId: true, company: { select: { verifiedStatus: true } } },
  })
  return members.filter((m) => m.company.verifiedStatus === "VERIFIED").map((m) => m.companyId)
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const members = await prisma.companyMember.findMany({ where: { userId: session.user.id }, select: { companyId: true } })
    const companyIds = members.map((m) => m.companyId)
    // Admins see their created jobs too
    const jobs = await prisma.privateJob.findMany({
      where: companyIds.length > 0 ? { companyId: { in: companyIds } } : { createdById: session.user.id },
      include: {
        company: true,
        _count: { select: { applications: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    })
    return NextResponse.json({ success: true, data: jobs })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    if (!body.slug && body.title) body.slug = `${slugify(body.title)}-${Date.now().toString(36)}`
    const v = privateJobSchema.safeParse(body)
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 })
    // Trusted posters only: OTP-verified membership + VERIFIED company required.
    // Manual companyName creation here is rejected - companies are born in verify/confirm.
    if (v.data.companyName) {
      return NextResponse.json({ success: false, error: "Verify your company with inbox OTP first (Studio Step 1), then post under it.", code: "OTP_REQUIRED" }, { status: 403 })
    }
    if (!v.data.companyId) return NextResponse.json({ success: false, error: "Company required" }, { status: 400 })
    const verifiedIds = await myVerifiedCompanyIds(session.user.id)
    if (!verifiedIds.includes(v.data.companyId)) {
      return NextResponse.json({ success: false, error: "Only OTP-verified company owners can post. Complete inbox verification first.", code: "OTP_REQUIRED" }, { status: 403 })
    }
    const { companyId, skills, isFresherFriendly, isWalkIn, ...rest } = v.data
    const company = await prisma.company.findUnique({ where: { id: companyId! } })
    if (!company || company.verifiedStatus !== "VERIFIED") {
      return NextResponse.json({ success: false, error: "Company is not verified yet. Complete inbox OTP verification first.", code: "OTP_REQUIRED" }, { status: 403 })
    }
    // Pasted HTML source / <style> designs are stored as clean markup.
    rest.description = cleanJobDescription(rest.description) ?? rest.description
    // Country (ISO) + canonical city, derived from the location text when not picked.
    normalizeJobGeo(rest)
    const trust = computeTrustScore({
      applicationUrl: rest.applicationUrl,
      applicationEmail: rest.applicationEmail,
      proofUrl: rest.proofUrl,
      companyWebsite: company.website,
      companyVerified: company.verifiedStatus === "VERIFIED",
      description: rest.description,
    })
    const job = await prisma.privateJob.create({
      data: {
        ...rest,
        ...(isFresherFriendly != null ? { isFresherFriendly } : {}),
        ...(isWalkIn != null ? { isWalkIn } : {}),
        skills: skills ?? [],
        trustScore: trust.score,
        source: "EMPLOYER",
        dedupeHash: dedupeHash(company.name, rest.title, rest.location),
        moderation: "APPROVED",
        company: { connect: { id: company.id } },
        createdBy: { connect: { id: session.user.id } },
      },
      include: { company: true },
    })
    // Look up the company's real logo once the response is sent (no-op when it already has one).
    scheduleLogoLookup([job.companyId])
    revalidatePublicContent("private-job", job.slug, { companySlug: job.company.slug })
    return NextResponse.json({ success: true, data: job }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
