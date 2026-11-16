import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { privateApplicationSchema } from "@/lib/validations"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const apps = await prisma.privateApplication.findMany({
      where: { userId: session.user.id, ...(status && status !== "all" ? { status: status as never } : {}) },
      include: { privateJob: { include: { company: true } } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    })
    const counts: Record<string, number> = {}
    for (const a of apps) counts[a.status] = (counts[a.status] || 0) + 1
    return NextResponse.json({
      success: true,
      data: apps.map((a) => ({
        id: a.id,
        status: a.status,
        interviewAt: a.interviewAt,
        notes: a.notes,
        appliedAt: a.appliedAt,
        updatedAt: a.updatedAt,
        job: {
          id: a.privateJob.id,
          title: a.privateJob.title,
          slug: a.privateJob.slug,
          company: a.privateJob.company.name,
          companyLogo: a.privateJob.company.logo,
          status: a.privateJob.status,
          location: a.privateJob.location,
          salary: a.privateJob.salary,
          salaryMin: a.privateJob.salaryMin,
          salaryMax: a.privateJob.salaryMax,
          lastDate: a.privateJob.lastDate,
          remotePolicy: a.privateJob.remotePolicy,
          type: a.privateJob.type,
        },
        href: `/private-jobs/${a.privateJob.slug}`,
      })),
      counts,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const body = await request.json()
    const v = privateApplicationSchema.safeParse(body)
    if (!v.success) return NextResponse.json({ success: false, error: v.error.issues[0].message }, { status: 400 })
    const job = await prisma.privateJob.findUnique({ where: { id: v.data.privateJobId } })
    if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })
    // Moving a job to Applied (or later) by hand also records when, once.
    const applied = v.data.status !== "saved" && v.data.status !== "withdrawn"
    const prev = applied
      ? await prisma.privateApplication.findUnique({ where: { userId_privateJobId: { userId: session.user.id, privateJobId: v.data.privateJobId } }, select: { appliedAt: true } })
      : null
    const appliedAt = applied ? (prev?.appliedAt ?? new Date()) : undefined
    const app = await prisma.privateApplication.upsert({
      where: { userId_privateJobId: { userId: session.user.id, privateJobId: v.data.privateJobId } },
      update: {
        status: v.data.status,
        ...(appliedAt ? { appliedAt } : {}),
        ...(v.data.interviewAt !== undefined ? { interviewAt: v.data.interviewAt } : {}),
        ...(v.data.notes !== undefined ? { notes: v.data.notes } : {}),
      },
      create: {
        userId: session.user.id,
        privateJobId: v.data.privateJobId,
        status: v.data.status,
        interviewAt: v.data.interviewAt || null,
        notes: v.data.notes || null,
        appliedAt: appliedAt ?? null,
        source: "manual",
      },
    })
    return NextResponse.json({ success: true, data: app })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const privateJobId = searchParams.get("privateJobId") || ""
    if (!privateJobId) return NextResponse.json({ success: false, error: "privateJobId required" }, { status: 400 })
    await prisma.privateApplication.deleteMany({ where: { userId: session.user.id, privateJobId } })
    return NextResponse.json({ success: true, data: null })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
