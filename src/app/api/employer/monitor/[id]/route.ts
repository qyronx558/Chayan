import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const job = await prisma.privateJob.findUnique({
      where: { id },
      include: { company: true },
    })
    if (!job) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 })

    // Access: owner/member of company OR creator OR admin
    const [member, isAdmin] = await Promise.all([
      prisma.companyMember.findUnique({ where: { companyId_userId: { companyId: job.companyId, userId: session.user.id } } }).catch(() => null),
      Promise.resolve(session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"),
    ])
    const isOwner = job.createdById === session.user.id
    if (!member && !isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Not authorized for this job" }, { status: 403 })
    }

    const since = new Date()
    since.setDate(since.getDate() - 30)
    const [viewsSeries, apps, reports, bookmarks] = await Promise.all([
      prisma.privateJobView.findMany({ where: { privateJobId: id, date: { gte: since } }, orderBy: { date: "asc" }, take: 31 }),
      prisma.privateApplication.groupBy({ by: ["status"], where: { privateJobId: id }, _count: true }),
      prisma.jobReport.findMany({ where: { privateJobId: id }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, reason: true, status: true, createdAt: true } }),
      prisma.bookmark.count({ where: { privateJobId: id } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        job: {
          id: job.id, title: job.title, slug: job.slug, type: job.type, status: job.status,
          moderation: job.moderation, trustScore: job.trustScore, views: job.views,
          location: job.location, remotePolicy: job.remotePolicy, lastDate: job.lastDate,
          createdAt: job.createdAt, company: { id: job.company.id, name: job.company.name, slug: job.company.slug, verifiedStatus: job.company.verifiedStatus },
        },
        viewsSeries: viewsSeries.map((v) => ({ date: v.date.toISOString().slice(0, 10), views: v.views })),
        funnel: apps.map((a) => ({ status: a.status, count: a._count })),
        reports,
        bookmarks,
        totals: {
          views: job.views,
          applies: apps.reduce((s, a) => s + a._count, 0),
          bookmarks,
          reports: reports.length,
        },
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
