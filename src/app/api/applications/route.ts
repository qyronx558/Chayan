import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { applicationSchema } from "@/lib/validations"

export async function GET(_request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const applications = await prisma.application.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    })

    const jobIds = applications.filter((a) => a.type === "job").map((a) => a.jobId)
    const admissionIds = applications.filter((a) => a.type === "admission").map((a) => a.jobId)

    const [jobs, admissions] = await Promise.all([
      jobIds.length
        ? prisma.job.findMany({
            where: { id: { in: jobIds } },
            include: { department: true, category: true },
          })
        : Promise.resolve([]),
      admissionIds.length
        ? prisma.admission.findMany({
            where: { id: { in: admissionIds } },
            include: { department: true, category: true },
          })
        : Promise.resolve([]),
    ])

    const jobMap = new Map(jobs.map((j) => [j.id, j]))
    const admissionMap = new Map(admissions.map((a) => [a.id, a]))

    const data = applications
      .map((app) => {
        const content = app.type === "admission" ? admissionMap.get(app.jobId) : jobMap.get(app.jobId)
        if (!content) return null

        const job = app.type === "job" ? jobMap.get(app.jobId) : null
        const importantDates = (job?.importantDates as Record<string, string> | null) || null
        const deadline =
          app.type === "admission"
            ? content.lastDate
            : job?.lastDate || (importantDates ? parseImportantDate(importantDates, ["Last Date", "Application Last Date"]) : null)
        const nextUpcoming =
          app.type === "job" && importantDates
            ? parseImportantDate(importantDates, ["Admit Card Date", "Exam Date", "Result Date"])
            : null

        return {
          id: app.id,
          type: app.type,
          status: app.status,
          appliedAt: app.appliedAt,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          deadline: deadline ? deadline.toISOString() : null,
          nextUpcoming: nextUpcoming ? nextUpcoming.toISOString() : null,
          content: {
            id: content.id,
            title: content.title,
            slug: content.slug,
            department: content.department.name,
            category: content.category?.name || null,
            location: job?.location || null,
            salary: job?.salary || null,
            totalVacancies: job?.totalVacancies ?? null,
            importantDates,
          },
          href: app.type === "admission" ? `/admission/${content.slug}` : `/apply/${content.slug}`,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    data.sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity
      return da - db
    })

    const counts = data.reduce<Record<string, number>>((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({ success: true, data, counts })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch applications" },
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

    const body = await request.json()
    const validation = applicationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { jobId, type, status } = validation.data

    const target = type === "admission"
      ? await prisma.admission.findUnique({ where: { id: jobId } })
      : await prisma.job.findUnique({ where: { id: jobId } })
    if (!target) {
      return NextResponse.json({ success: false, error: "Content not found" }, { status: 404 })
    }

    const existing = await prisma.application.findUnique({
      where: { userId_jobId: { userId: session.user.id, jobId } },
    })

    if (existing) {
      const shouldSetAppliedAt = existing.status === "interested" && status !== "interested" && !existing.appliedAt
      const application = await prisma.application.update({
        where: { id: existing.id },
        data: {
          type,
          status,
          ...(shouldSetAppliedAt ? { appliedAt: new Date() } : {}),
        },
      })
      return NextResponse.json({ success: true, data: application })
    }

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        jobId,
        type,
        status,
        appliedAt: status !== "interested" ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, data: application }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to save application" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")

    if (!jobId) {
      return NextResponse.json({ success: false, error: "jobId is required" }, { status: 400 })
    }

    const application = await prisma.application.findUnique({
      where: { userId_jobId: { userId: session.user.id, jobId } },
    })
    if (!application) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 })
    }

    await prisma.application.delete({ where: { id: application.id } })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to remove application" },
      { status: 500 }
    )
  }
}

function parseImportantDate(dates: Record<string, string>, keys: string[]): Date | null {
  for (const key of keys) {
    const value = dates[key]
    if (!value) continue
    const match = value.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/)
    if (!match) continue
    const [d, m, y] = match[0].split(/[-/]/).map(Number)
    const date = new Date(y < 100 ? 2000 + y : y, m - 1, d)
    if (!isNaN(date.getTime())) return date
  }
  return null
}