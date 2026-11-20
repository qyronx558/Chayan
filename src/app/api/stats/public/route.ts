import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicApiResponse } from "@/lib/cache"

/**
 * Site-wide counts for the home page. Same for every visitor, so it carries
 * no session work and is cached at the CDN: one database round per cache
 * window instead of one per home-page visit (/api/stats stays per-user and
 * uncached for the dashboards).
 */
export async function GET() {
  try {
    const [
      activeJobs,
      totalResults,
      totalAdmitCards,
      totalAnswerKeys,
      totalPrivateJobs,
      totalAdmissions,
      totalSyllabus,
      totalUsers,
    ] = await Promise.all([
      prisma.job.count({ where: { status: "ACTIVE" } }),
      prisma.result.count(),
      prisma.admitCard.count(),
      prisma.answerKey.count(),
      prisma.privateJob.count(),
      prisma.admission.count(),
      prisma.syllabus.count(),
      prisma.user.count(),
    ])
    return publicApiResponse(
      {
        success: true,
        data: {
          activeJobs,
          totalResults,
          totalAdmitCards,
          totalAnswerKeys,
          totalPrivateJobs,
          totalAdmissions,
          totalSyllabus,
          totalUsers,
        },
      },
      "gov"
    )
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 })
  }
}
