import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { contentScope } from "@/lib/roles"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let scopeWhere: { createdById?: string } = {}
    if (searchParams.get("scope") === "mine") {
      const session = await auth()
      scopeWhere = contentScope(session?.user?.role, session?.user?.id)
    }

    const [
      totalJobs,
      activeJobs,
      totalResults,
      totalUsers,
      totalCategories,
      totalDepartments,
      totalAdmitCards,
      totalAnswerKeys,
      totalPrivateJobs,
      totalAdmissions,
      totalSyllabus,
      recentJobs,
    ] = await Promise.all([
      prisma.job.count({ where: scopeWhere }),
      prisma.job.count({ where: { ...scopeWhere, status: "ACTIVE" } }),
      prisma.result.count({ where: scopeWhere }),
      prisma.user.count(),
      prisma.category.count(),
      prisma.department.count(),
      prisma.admitCard.count({ where: scopeWhere }),
      prisma.answerKey.count({ where: scopeWhere }),
      prisma.privateJob.count({ where: scopeWhere }),
      prisma.admission.count({ where: scopeWhere }),
      prisma.syllabus.count({ where: scopeWhere }),
      prisma.job.findMany({
        where: { ...scopeWhere, status: "ACTIVE" },
        include: { department: true, category: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ])

    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - 6)

    const recentRows = await prisma.job.findMany({
      where: { ...scopeWhere, createdAt: { gte: start } },
      select: { createdAt: true },
    })

    const byDay = new Map<string, number>()
    for (const row of recentRows) {
      const d = new Date(row.createdAt)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString()
      byDay.set(key, (byDay.get(key) || 0) + 1)
    }

    const jobsCreatedLast7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const key = d.toISOString()
      return { date: key.slice(0, 10), count: byDay.get(key) || 0 }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        totalResults,
        totalUsers,
        totalCategories,
        totalDepartments,
        totalAdmitCards,
        totalAnswerKeys,
        totalPrivateJobs,
        totalAdmissions,
        totalSyllabus,
        recentJobs,
        jobsCreatedLast7Days,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
