import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"


export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    const userId = session.user.id

    const members = await prisma.companyMember.findMany({
      where: { userId },
      select: { companyId: true, company: { select: { id: true, name: true, verifiedStatus: true } } },
    })
    const companyIds = members.map((m) => m.companyId)
    if (companyIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: { companies: [], jobs: [], viewsSeries: [], totals: { views: 0, applies: 0, bookmarks: 0, earningsCoins: 0 } },
      })
    }

    const since = new Date()
    since.setDate(since.getDate() - 30)

    const [jobs, viewsSeries, clicks, apps, bookmarks, coins] = await Promise.all([
      prisma.privateJob.findMany({
        where: { companyId: { in: companyIds } },
        include: { company: { select: { id: true, name: true } }, _count: { select: { applications: true } } },
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
      prisma.privateJobView.findMany({
        where: { privateJob: { companyId: { in: companyIds } }, date: { gte: since } },
        orderBy: { date: "asc" },
        take: 500,
        select: { date: true, views: true, privateJobId: true },
      }),
      prisma.jobClick.groupBy({ by: ["privateJobId", "kind"], where: { privateJob: { companyId: { in: companyIds } } }, _count: true }),
      prisma.privateApplication.groupBy({ by: ["privateJobId", "status"], where: { privateJob: { companyId: { in: companyIds } } }, _count: true }),
      prisma.bookmark.groupBy({ by: ["privateJobId"], where: { privateJobId: { not: undefined }, privateJob: { companyId: { in: companyIds } } }, _count: true }),
      prisma.coinLedger.groupBy({ by: ["jobId"], where: { companyId: { in: companyIds }, status: { in: ["PENDING", "APPROVED", "PAID"] } }, _sum: { coins: true } }),
    ])

    const clicksByJob = new Map<string, { APPLY: number; EMAIL: number; DETAIL: number }>()
    for (const c of clicks) {
      const cur = clicksByJob.get(c.privateJobId) || { APPLY: 0, EMAIL: 0, DETAIL: 0 }
      cur[c.kind] = c._count
      clicksByJob.set(c.privateJobId, cur)
    }
    const appsByJob = new Map<string, number>()
    for (const a of apps) appsByJob.set(a.privateJobId, (appsByJob.get(a.privateJobId) || 0) + a._count)
    const savesByJob = new Map(bookmarks.map((b) => [b.privateJobId as string, b._count]))

    const byDay = new Map<string, number>()
    for (const v of viewsSeries) {
      const k = v.date.toISOString().slice(0, 10)
      byDay.set(k, (byDay.get(k) || 0) + v.views)
    }

    const coinsByJob = new Map(coins.map((c) => [c.jobId as string, c._sum.coins || 0]))
    const jobRows = jobs.map((j) => {
      const ck = clicksByJob.get(j.id) || { APPLY: 0, EMAIL: 0, DETAIL: 0 }
      const applies = appsByJob.get(j.id) || 0
      return {
        id: j.id, title: j.title, slug: j.slug, type: j.type, status: j.status,
        moderation: j.moderation, trustScore: j.trustScore, views: j.views,
        company: j.company, applies, bookmarks: savesByJob.get(j.id) || 0,
        clicks: ck, earningsCoins: coinsByJob.get(j.id) || 0,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        companies: members.map((m) => m.company),
        jobs: jobRows,
        viewsSeries: [...byDay.entries()].map(([date, views]) => ({ date, views })),
        totals: {
          views: jobRows.reduce((s, j) => s + j.views, 0),
          applies: jobRows.reduce((s, j) => s + j.applies, 0),
          bookmarks: jobRows.reduce((s, j) => s + j.bookmarks, 0),
          earningsCoins: jobRows.reduce((s, j) => s + j.earningsCoins, 0),
        },
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
