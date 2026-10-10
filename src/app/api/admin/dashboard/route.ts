import { NextRequest, NextResponse } from "next/server"
import { format } from "date-fns"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { moduleDb } from "@/lib/admin/dashboard-server"
import {
  MODULE_CATALOG,
  changePct,
  parseRange,
  type AttentionDatum,
  type DashboardPayload,
  type DashboardRole,
  type KpiDatum,
  type RecentJobDatum,
  type TrendPoint,
} from "@/components/admin/dashboard/types"

const DAY = 86400000

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function bucketize(rows: Array<{ createdAt: Date }>, index: Map<string, number>, size: number): number[] {
  const out = new Array<number>(size).fill(0)
  for (const row of rows) {
    const at = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)
    const i = index.get(dayKey(at))
    if (i !== undefined) out[i] += 1
  }
  return out
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }
    const role = session.user.role as DashboardRole
    const isSuper = role === "SUPER_ADMIN"
    const range = parseRange(new URL(request.url).searchParams.get("range"))
    const own: Record<string, unknown> = isSuper ? {} : { createdById: session.user.id }

    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = Array.from({ length: range }, (_, i) => new Date(today.getTime() - (range - 1 - i) * DAY))
    const dayIndex = new Map(days.map((d, i) => [dayKey(d), i] as [string, number]))
    const periodStart = days[0]
    const prevStart = new Date(periodStart.getTime() - range * DAY)
    const closingLimit = new Date(now.getTime() + 3 * DAY)

    const db = moduleDb()

    const stats = await Promise.all(
      MODULE_CATALOG.map(async (m) => {
        const client = db[m.delegate]
        const [groups, createdCur, createdPrev, approvedCur, approvedPrev, pendingCur, pendingPrev] =
          await Promise.all([
            client.groupBy({ by: ["moderation"], where: own, _count: true }),
            client.count({ where: { ...own, createdAt: { gte: periodStart } } }),
            client.count({ where: { ...own, createdAt: { gte: prevStart, lt: periodStart } } }),
            client.count({ where: { ...own, moderation: "APPROVED", createdAt: { gte: periodStart } } }),
            client.count({
              where: { ...own, moderation: "APPROVED", createdAt: { gte: prevStart, lt: periodStart } },
            }),
            client.count({ where: { ...own, moderation: "PENDING", createdAt: { gte: periodStart } } }),
            client.count({
              where: { ...own, moderation: "PENDING", createdAt: { gte: prevStart, lt: periodStart } },
            }),
          ])
        const pick = (s: string) => groups.find((g) => g.moderation === s)?._count ?? 0
        return {
          approved: pick("APPROVED"),
          pending: pick("PENDING"),
          rejected: pick("REJECTED"),
          createdCur,
          createdPrev,
          approvedCur,
          approvedPrev,
          pendingCur,
          pendingPrev,
        }
      })
    )

    const sum = (f: (s: (typeof stats)[number]) => number) => stats.reduce((n, s) => n + f(s), 0)
    const totalApproved = sum((s) => s.approved)
    const totalPending = sum((s) => s.pending)
    const totalRejected = sum((s) => s.rejected)
    const totalCreatedCur = sum((s) => s.createdCur)
    const totalCreatedPrev = sum((s) => s.createdPrev)
    const approvedCur = sum((s) => s.approvedCur)
    const approvedPrev = sum((s) => s.approvedPrev)
    const pendingCur = sum((s) => s.pendingCur)
    const pendingPrev = sum((s) => s.pendingPrev)
    const approvalRate =
      totalApproved + totalRejected > 0
        ? Math.round((totalApproved / (totalApproved + totalRejected)) * 1000) / 10
        : null

    const trendRows = await Promise.all(
      MODULE_CATALOG.map((m) =>
        db[m.delegate].findMany({
          where: isSuper
            ? { moderation: "APPROVED", createdAt: { gte: prevStart } }
            : { ...own, createdAt: { gte: prevStart } },
          select: { createdAt: true },
        })
      )
    )
    const curBuckets = new Array<number>(range).fill(0)
    const prevBuckets = new Array<number>(range).fill(0)
    for (const rows of trendRows) {
      for (const row of rows) {
        const at = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)
        const t = at.getTime()
        if (t >= periodStart.getTime()) {
          const i = dayIndex.get(dayKey(at))
          if (i !== undefined) curBuckets[i] += 1
        } else {
          const shifted = new Date(t + range * DAY)
          const i = dayIndex.get(dayKey(shifted))
          if (i !== undefined) prevBuckets[i] += 1
        }
      }
    }
    const points: TrendPoint[] = days.map((d, i) => ({
      label: format(d, range === 7 ? "EEE" : "d MMM"),
      current: curBuckets[i] ?? 0,
      previous: prevBuckets[i] ?? 0,
    }))
    const trendTotal = curBuckets.reduce((n, c) => n + c, 0)
    const trendPrev = prevBuckets.reduce((n, c) => n + c, 0)

    const seriesWhere = (extra: Record<string, unknown>) => ({ ...extra, createdAt: { gte: periodStart } })
    const [s1, s2, s3, s4] = isSuper
      ? await Promise.all([
          db.job.findMany({ where: seriesWhere({}), select: { createdAt: true } }),
          db.result.findMany({ where: seriesWhere({}), select: { createdAt: true } }),
          prisma.user.findMany({
            where: { role: "USER", createdAt: { gte: periodStart } },
            select: { createdAt: true },
          }),
          Promise.all(
            MODULE_CATALOG.map((m) =>
              db[m.delegate].findMany({
                where: seriesWhere({ moderation: "PENDING" }),
                select: { createdAt: true },
              })
            )
          ).then((nested) => nested.flat()),
        ])
      : await Promise.all([
          Promise.all(
            MODULE_CATALOG.map((m) =>
              db[m.delegate].findMany({ where: seriesWhere({ ...own }), select: { createdAt: true } })
            )
          ).then((nested) => nested.flat()),
          Promise.all(
            MODULE_CATALOG.map((m) =>
              db[m.delegate].findMany({
                where: seriesWhere({ ...own, moderation: "APPROVED" }),
                select: { createdAt: true },
              })
            )
          ).then((nested) => nested.flat()),
          Promise.all(
            MODULE_CATALOG.map((m) =>
              db[m.delegate].findMany({
                where: seriesWhere({ ...own, moderation: "PENDING" }),
                select: { createdAt: true },
              })
            )
          ).then((nested) => nested.flat()),
          Promise.all(
            MODULE_CATALOG.map((m) =>
              db[m.delegate].findMany({
                where: seriesWhere({ ...own, moderation: "REJECTED" }),
                select: { createdAt: true },
              })
            )
          ).then((nested) => nested.flat()),
        ])

    let userTotal = 0
    let userCur = 0
    let userPrev = 0
    if (isSuper) {
      ;[userTotal, userCur, userPrev] = await Promise.all([
        prisma.user.count({ where: { role: "USER" } }),
        prisma.user.count({ where: { role: "USER", createdAt: { gte: periodStart } } }),
        prisma.user.count({ where: { role: "USER", createdAt: { gte: prevStart, lt: periodStart } } }),
      ])
    }
    const jobActive = isSuper ? await db.job.count({ where: { status: "ACTIVE" } }) : 0
    const jobTotal = isSuper
      ? stats[0].approved + stats[0].pending + stats[0].rejected
      : 0
    const jobCur = stats[0].createdCur
    const jobPrev = stats[0].createdPrev
    const resultTotal = stats[2].approved + stats[2].pending + stats[2].rejected
    const resultCur = stats[2].createdCur
    const resultPrev = stats[2].createdPrev

    const kpis: KpiDatum[] = isSuper
      ? [
          {
            key: "jobs",
            label: "Total jobs",
            value: jobTotal,
            sub: `${jobActive.toLocaleString("en-IN")} active`,
            deltaPct: changePct(jobCur, jobPrev),
            spark: bucketize(s1, dayIndex, range),
            needsAction: false,
          },
          {
            key: "results",
            label: "Results",
            value: resultTotal,
            sub: `${resultCur.toLocaleString("en-IN")} added in ${range}d`,
            deltaPct: changePct(resultCur, resultPrev),
            spark: bucketize(s2, dayIndex, range),
            needsAction: false,
          },
          {
            key: "users",
            label: "Registered users",
            value: userTotal,
            sub: `${userCur.toLocaleString("en-IN")} new in ${range}d`,
            deltaPct: changePct(userCur, userPrev),
            spark: bucketize(s3, dayIndex, range),
            needsAction: false,
          },
          {
            key: "pending",
            label: "Pending review",
            value: totalPending,
            sub: "across 8 modules",
            deltaPct: changePct(pendingCur, pendingPrev),
            spark: bucketize(s4, dayIndex, range),
            needsAction: totalPending > 0,
          },
        ]
      : [
          {
            key: "uploads",
            label: "My uploads",
            value: totalApproved + totalPending + totalRejected,
            sub: `${totalCreatedCur.toLocaleString("en-IN")} in last ${range}d`,
            deltaPct: changePct(totalCreatedCur, totalCreatedPrev),
            spark: bucketize(s1, dayIndex, range),
            needsAction: false,
          },
          {
            key: "published",
            label: "Published",
            value: totalApproved,
            sub: approvalRate === null ? "no reviews yet" : `${approvalRate}% approval rate`,
            deltaPct: changePct(approvedCur, approvedPrev),
            spark: bucketize(s2, dayIndex, range),
            needsAction: false,
          },
          {
            key: "waiting",
            label: "Waiting for review",
            value: totalPending,
            sub: "submitted, awaiting review",
            deltaPct: changePct(pendingCur, pendingPrev),
            spark: bucketize(s3, dayIndex, range),
            needsAction: false,
          },
          {
            key: "needs",
            label: "Needs changes",
            value: totalRejected,
            sub: "fix and resubmit",
            deltaPct: null,
            spark: bucketize(s4, dayIndex, range),
            needsAction: totalRejected > 0,
          },
        ]

    let attention: AttentionDatum[]
    if (isSuper) {
      const [scam, closing, bulkLogs] = await Promise.all([
        prisma.jobReport.count({ where: { status: "PENDING" } }),
        db.job.count({ where: { lastDate: { gte: now, lte: closingLimit } } }),
        prisma.log.findMany({
          where: { action: "BULK_CREATE", createdAt: { gte: periodStart } },
          select: { details: true },
        }),
      ])
      const failedImports = bulkLogs.filter((l) => l.details !== null && /errors=[1-9]/i.test(l.details)).length
      attention = [
        {
          key: "pending-verification",
          label: "Pending verification",
          sub: "admin uploads waiting",
          count: totalPending,
          href: "/admin/review",
        },
        {
          key: "scam-reports",
          label: "Scam reports",
          sub: "unresolved reports",
          count: scam,
          href: "/admin/reports",
        },
        {
          key: "closing-soon",
          label: "Closing in 3 days",
          sub: "jobs past due soon",
          count: closing,
          href: "/admin/expiring",
        },
        {
          key: "failed-imports",
          label: "Failed imports",
          sub: `rows with errors · ${range}d`,
          count: failedImports,
          href: "/admin/bulk-upload",
        },
      ]
    } else {
      const closing = await db.job.count({
        where: { createdById: session.user.id, lastDate: { gte: now, lte: closingLimit } },
      })
      attention = [
        {
          key: "needs-changes",
          label: "Needs changes",
          sub: "rejected, fix and resubmit",
          count: totalRejected,
          href: "/admin/jobs?tab=rejected",
        },
        {
          key: "drafts",
          label: "Drafts to finish",
          sub: `submitted in last ${range}d`,
          count: pendingCur,
          href: "/admin/jobs?tab=draft",
        },
        {
          key: "waiting",
          label: "Waiting for review",
          sub: "with the review team",
          count: totalPending,
          href: "/admin/jobs?tab=needs",
        },
        {
          key: "closing-soon",
          label: "Closing soon",
          sub: "your jobs, 3 days",
          count: closing,
          href: "/admin/expiring",
        },
      ]
    }

    const recentRows = await prisma.job.findMany({
      where: own,
      select: {
        id: true,
        title: true,
        moderation: true,
        lastDate: true,
        createdAt: true,
        department: { select: { name: true } },
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 9,
    })
    const tabFor = (moderation: string) =>
      moderation === "APPROVED" ? "published" : moderation === "REJECTED" ? "rejected" : "needs"
    const recent: RecentJobDatum[] = recentRows.map((j) => ({
      id: j.id,
      title: j.title,
      org: j.department?.name ?? "",
      uploader: j.createdBy?.name ?? j.createdBy?.email ?? "",
      moderation: j.moderation,
      lastDate: j.lastDate ? j.lastDate.toISOString() : null,
      createdAt: j.createdAt.toISOString(),
      href: `/admin/jobs?tab=${tabFor(j.moderation)}`,
    }))

    const oldestCandidates = await Promise.all(
      MODULE_CATALOG.map(async (m) => {
        const row = await db[m.delegate].findFirst({
          where: { ...own, moderation: "PENDING" },
          orderBy: { createdAt: "asc" },
          select: { id: true, title: true, createdAt: true },
        })
        return row ? { ...row, module: m.label } : null
      })
    )
    const oldest = oldestCandidates
      .filter((r): r is { id: string; title: string; createdAt: Date; module: string } => r !== null)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]

    const reviewedNested = await Promise.all(
      MODULE_CATALOG.map((m) =>
        db[m.delegate].findMany({
          where: { ...own, reviewedAt: { not: null } },
          select: { createdAt: true, reviewedAt: true },
          orderBy: { reviewedAt: "desc" },
          take: 40,
        })
      )
    )
    let reviewHours = 0
    let reviewCount = 0
    for (const rows of reviewedNested) {
      for (const row of rows) {
        if (!row.reviewedAt) continue
        const start = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)
        const end = row.reviewedAt instanceof Date ? row.reviewedAt : new Date(row.reviewedAt)
        reviewHours += (end.getTime() - start.getTime()) / 3600000
        reviewCount += 1
      }
    }

    const pipelineTotal = totalApproved + totalPending + totalRejected
    const draftCount = pendingCur
    const waitingCount = Math.max(0, totalPending - pendingCur)
    const pct = (n: number) => (pipelineTotal > 0 ? Math.round((n / pipelineTotal) * 1000) / 10 : 0)
    const payload: DashboardPayload = {
      role,
      range,
      generatedAt: now.toISOString(),
      kpis,
      trend: { points, total: trendTotal, changePct: changePct(trendTotal, trendPrev) },
      attention,
      recent,
      pipeline: {
        segments: [
          { key: "published", label: "Published", count: totalApproved, pct: pct(totalApproved) },
          { key: "pending", label: "Pending", count: waitingCount, pct: pct(waitingCount) },
          { key: "draft", label: "Draft", count: draftCount, pct: pct(draftCount) },
          { key: "rejected", label: "Rejected", count: totalRejected, pct: pct(totalRejected) },
        ],
        total: pipelineTotal,
        avgReviewHours: reviewCount > 0 ? Math.round((reviewHours / reviewCount) * 10) / 10 : null,
        approvalRate,
        oldestPending: oldest
          ? {
              id: oldest.id,
              title: oldest.title,
              module: oldest.module,
              createdAt: new Date(oldest.createdAt).toISOString(),
            }
          : null,
      },
    }
    return NextResponse.json({ success: true, data: payload })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load dashboard" },
      { status: 500 }
    )
  }
}
