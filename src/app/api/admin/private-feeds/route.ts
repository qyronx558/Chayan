import { NextRequest, NextResponse } from "next/server"
import { scheduleLogoLookup } from "@/lib/private-jobs/logo"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/location-api"
import { migrationHint } from "@/lib/ingest/admin"
import { writeAuditLog } from "@/lib/moderation"
import { findOrCreateCompany } from "@/lib/companies"
import { boardTokenFrom, fetchFeed, FeedError } from "@/lib/private-jobs/feeds"
import { feedPublicUrl, isIndiaPosting } from "@/lib/private-jobs/feed-sync"
import { careerPageKey, readCareerPage, safeCareerUrl } from "@/lib/private-jobs/career-page"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const guard = () => requireSuperAdmin("Only super admins can manage job feeds")

const createSchema = z.object({
  provider: z.enum(["GREENHOUSE", "LEVER", "ASHBY", "SMARTRECRUITERS", "WORKABLE", "RECRUITEE", "PERSONIO", "BREEZY", "CAREER_PAGE"]),
  board: z.string().trim().min(1).max(500),
  companyName: z.string().trim().min(1).max(150),
  companyWebsite: z.string().trim().max(300).optional().or(z.literal("")),
  indiaOnly: z.boolean().optional().default(true),
})

/** GET → every feed with its last run and live/closed counts, plus seeding totals for the overview. */
export async function GET() {
  const g = await guard()
  if (!g.ok) return g.response
  try {
    const dayAgo = new Date(Date.now() - 86_400_000)
    const [feeds, counts, created24h, pendingReview, liveTotal, missingLogos] = await Promise.all([
      prisma.privateJobFeed.findMany({
        orderBy: { createdAt: "desc" },
        include: { company: { select: { id: true, name: true, slug: true, verifiedStatus: true } } },
      }),
      prisma.privateJob.groupBy({ by: ["feedId", "status"], where: { feedId: { not: null } }, _count: { _all: true } }),
      prisma.privateJob.count({ where: { source: "ATS_FEED", createdAt: { gte: dayAgo } } }),
      prisma.privateJob.count({ where: { source: "ATS_FEED", moderation: "PENDING" } }),
      prisma.privateJob.count({ where: { source: "ATS_FEED", status: "ACTIVE", moderation: "APPROVED" } }),
      prisma.company.count({ where: { OR: [{ logo: null }, { logo: "" }], privateJob: { some: { status: "ACTIVE" } } } }),
    ])
    const byFeed = new Map<string, { active: number; expired: number }>()
    for (const c of counts) {
      if (!c.feedId) continue
      const row = byFeed.get(c.feedId) ?? { active: 0, expired: 0 }
      if (c.status === "ACTIVE") row.active += c._count._all
      else row.expired += c._count._all
      byFeed.set(c.feedId, row)
    }
    return NextResponse.json({
      success: true,
      summary: {
        feeds: feeds.length,
        enabled: feeds.filter((f) => f.enabled).length,
        problems: feeds.filter((f) => f.lastStatus && f.lastStatus !== "OK").length,
        liveJobs: liveTotal,
        created24h,
        pendingReview,
        missingLogos,
      },
      data: feeds.map((f) => ({
        ...f,
        boardUrl: feedPublicUrl(f),
        jobs: byFeed.get(f.id) ?? { active: 0, expired: 0 },
      })),
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: migrationHint(e) ?? "Failed to load feeds" }, { status: 500 })
  }
}

/**
 * POST → check the source live, then save it. A careers page that embeds a
 * Greenhouse / Lever / Ashby board is saved as that board (exact data, no AI).
 */
export async function POST(request: NextRequest) {
  const g = await guard()
  if (!g.ok) return g.response
  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
  }
  const { board, companyName, companyWebsite, indiaOnly } = parsed.data
  let provider = parsed.data.provider
  let boardToken: string | null
  let pageUrl: string | null = null
  let fetched = 0
  let inScope = 0
  let note: string | null = null

  try {
    if (provider === "CAREER_PAGE") {
      const url = safeCareerUrl(board)
      if (!url) return NextResponse.json({ success: false, error: "Enter a public http(s) careers page URL" }, { status: 400 })
      const page = await readCareerPage(url.toString(), { companyName })
      note = page.note
      if (page.ats) {
        provider = page.ats.provider
        boardToken = page.ats.token
      } else {
        pageUrl = url.toString()
        boardToken = careerPageKey(pageUrl)
      }
      fetched = page.postings.length
      inScope = indiaOnly ? page.postings.filter((p) => !p.location || isIndiaPosting(p)).length : fetched
    } else {
      boardToken = boardTokenFrom(provider, board)
      if (!boardToken) {
        return NextResponse.json(
          { success: false, error: "Enter the board token or the board URL (e.g. boards.greenhouse.io/acme, jobs.lever.co/acme, jobs.ashbyhq.com/acme)" },
          { status: 400 }
        )
      }
      const postings = await fetchFeed(provider, boardToken)
      fetched = postings.length
      inScope = indiaOnly ? postings.filter(isIndiaPosting).length : postings.length
    }
  } catch (e) {
    const status = e instanceof FeedError && e.status && e.status < 500 ? 400 : 502
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : "Could not reach the source" }, { status })
  }

  try {
    const existing = await prisma.privateJobFeed.findUnique({ where: { provider_boardToken: { provider, boardToken: boardToken as string } } })
    if (existing) return NextResponse.json({ success: false, error: "This source is already added" }, { status: 409 })
    const company = await findOrCreateCompany(companyName, companyWebsite || null)
    const feed = await prisma.privateJobFeed.create({
      data: { provider, boardToken: boardToken as string, pageUrl, companyId: company.id, indiaOnly, createdById: g.user.id },
    })
    await writeAuditLog({
      action: "CREATE",
      entity: "PrivateJobFeed",
      entityId: feed.id,
      userId: g.user.id,
      details: `${provider} ${pageUrl ?? boardToken} for ${company.name} (${fetched} postings, ${inScope} in scope)`,
    })
    // Look up the company's real logo once the response is sent (no-op when it already has one).
    scheduleLogoLookup([company.id])
    return NextResponse.json({ success: true, data: feed, preview: { fetched, inScope, provider, note } }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ success: false, error: migrationHint(e) ?? "Failed to save feed" }, { status: 500 })
  }
}
