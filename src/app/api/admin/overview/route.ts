import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Super-admin overview: every ADMIN/SUPER_ADMIN with per-type content counts
 * split by moderation (PENDING/APPROVED/REJECTED), keyed by unique Admin ID (User.id).
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden: super admin only" }, { status: 403 })
    }

    // Verification scope: only ADMIN accounts (never SUPER_ADMIN's own uploads).
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    })

    const perAdmin = await Promise.all(
      admins.map(async (a) => {
        const [jobs, privateJobs, results, admitCards, answerKeys, admissions, syllabi, blogPosts, pendingTotal] =
          await Promise.all([
            prisma.job.groupBy({ by: ["moderation"], where: { createdById: a.id }, _count: true }),
            prisma.privateJob.groupBy({ by: ["moderation"], where: { createdById: a.id }, _count: true }),
            prisma.result.groupBy({ by: ["moderation"], where: { createdById: a.id }, _count: true }),
            prisma.admitCard.groupBy({ by: ["moderation"], where: { createdById: a.id }, _count: true }),
            prisma.answerKey.groupBy({ by: ["moderation"], where: { createdById: a.id }, _count: true }),
            prisma.admission.groupBy({ by: ["moderation"], where: { createdById: a.id }, _count: true }),
            prisma.syllabus.groupBy({ by: ["moderation"], where: { createdById: a.id }, _count: true }),
            prisma.blogPost.groupBy({ by: ["moderation"], where: { createdById: a.id }, _count: true }),
            prisma.job.count({ where: { createdById: a.id, moderation: "PENDING" } }).then(async (j) => {
              const [pj, r, ac, ak, ad, s, b] = await Promise.all([
                prisma.privateJob.count({ where: { createdById: a.id, moderation: "PENDING" } }),
                prisma.result.count({ where: { createdById: a.id, moderation: "PENDING" } }),
                prisma.admitCard.count({ where: { createdById: a.id, moderation: "PENDING" } }),
                prisma.answerKey.count({ where: { createdById: a.id, moderation: "PENDING" } }),
                prisma.admission.count({ where: { createdById: a.id, moderation: "PENDING" } }),
                prisma.syllabus.count({ where: { createdById: a.id, moderation: "PENDING" } }),
                prisma.blogPost.count({ where: { createdById: a.id, moderation: "PENDING" } }),
              ])
              return j + pj + r + ac + ak + ad + s + b
            }),
          ])
        const sum = (groups: { _count: number }[]) => groups.reduce((n, g) => n + g._count, 0)
        const total =
          sum(jobs) + sum(privateJobs) + sum(results) + sum(admitCards) +
          sum(answerKeys) + sum(admissions) + sum(syllabi) + sum(blogPosts)
        return {
          adminId: a.id,
          name: a.name,
          email: a.email,
          role: a.role,
          createdAt: a.createdAt,
          total,
          pendingTotal,
          byType: {
            Job: sum(jobs),
            PrivateJob: sum(privateJobs),
            Result: sum(results),
            AdmitCard: sum(admitCards),
            AnswerKey: sum(answerKeys),
            Admission: sum(admissions),
            Syllabus: sum(syllabi),
            Blog: sum(blogPosts),
          },
        }
      })
    )

    // Pending queue counts only ADMIN uploads (matches the verification queue).
    const adminOnly = { createdBy: { role: "ADMIN" as const } }
    const queueTotals = await Promise.all([
      prisma.job.count({ where: { moderation: "PENDING", ...adminOnly } }),
      prisma.privateJob.count({ where: { moderation: "PENDING", ...adminOnly } }),
      prisma.result.count({ where: { moderation: "PENDING", ...adminOnly } }),
      prisma.admitCard.count({ where: { moderation: "PENDING", ...adminOnly } }),
      prisma.answerKey.count({ where: { moderation: "PENDING", ...adminOnly } }),
      prisma.admission.count({ where: { moderation: "PENDING", ...adminOnly } }),
      prisma.syllabus.count({ where: { moderation: "PENDING", ...adminOnly } }),
      prisma.blogPost.count({ where: { moderation: "PENDING", ...adminOnly } }),
    ])
    const pendingQueue = {
      Job: queueTotals[0],
      PrivateJob: queueTotals[1],
      Result: queueTotals[2],
      AdmitCard: queueTotals[3],
      AnswerKey: queueTotals[4],
      Admission: queueTotals[5],
      Syllabus: queueTotals[6],
      Blog: queueTotals[7],
      total: queueTotals.reduce((n, c) => n + c, 0),
    }

    return NextResponse.json({ success: true, data: { admins: perAdmin, pendingQueue } })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch overview" },
      { status: 500 }
    )
  }
}
