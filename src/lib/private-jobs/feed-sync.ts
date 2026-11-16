import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { computeTrustScore } from "@/lib/private-jobs-trust"
import { revalidatePublicContent } from "@/lib/cache"
import { enrichSmartRecruiters, fetchFeed, feedBoardUrl, FeedError, type FeedPosting, type FeedProvider, type FetchLike } from "@/lib/private-jobs/feeds"
import { parseLocation, toCountryCode } from "@/lib/private-jobs/geo"
import { readCareerPage } from "@/lib/private-jobs/career-page"
import { getFeedSettings, type FeedSettings } from "@/lib/private-jobs/settings"
import {
  contentHashOf,
  dedupeHash,
  detectJobType,
  detectRemotePolicy,
  experienceLabel,
  extractPostingSkills,
  isFresherFriendly,
  isIndiaLocation,
  normalizeLocation,
  parseExperience,
  parseSalaryINR,
  salaryLabel,
  structuredSalaryINR,
  type JobTypeValue,
  type RemotePolicyValue,
} from "@/lib/private-jobs/normalize"

/** A posting missing from this many consecutive runs is closed (one miss can be a flaky source). */
export const FEED_MISSES_TO_CLOSE = 2
/** Feed postings expire on their own this long after they were last seen (safety net if a feed is disabled). */
export const FEED_EXPIRY_DAYS = 45
/** Cap on new postings per feed per run, so one huge board cannot starve the others. */
export const MAX_CREATES_PER_RUN = 400
/** Circuit breaker: never close more than this share of a feed's live jobs in one run. */
export const MAX_CLOSE_SHARE = 0.5

const DESCRIPTION_MAX = 20_000
/** SmartRecruiters detail calls per feed run (one request per new posting). */
export const SMARTRECRUITERS_DETAILS_PER_RUN = 150
/** Boards synced at the same time by runDueFeeds (careers pages read with AI stay one at a time). */
export const FEED_CONCURRENCY = 5

export type FeedSource = FeedProvider | "CAREER_PAGE"

export interface FeedContext {
  id: string
  provider: FeedSource
  boardToken: string
  /** Public board / careers page URL: shown as the posting's proof. */
  boardUrl: string
  indiaOnly: boolean
  createdById: string | null
  company: { id: string; name: string; website: string | null; verified: boolean }
}

/** The PrivateJob columns a feed owns; admins' moderation/status decisions are never overwritten. */
export interface FeedJobFields {
  title: string
  description: string | null
  location: string | null
  remotePolicy: RemotePolicyValue
  type: JobTypeValue
  category: string | null
  skills: string[]
  salary: string | null
  salaryMin: number | null
  salaryMax: number | null
  experience: string | null
  expMin: number | null
  expMax: number | null
  isFresherFriendly: boolean
  applicationUrl: string
  sourceUrl: string
  /** The company's official board / careers page: proof the opening is real. */
  proofUrl: string
  trustScore: number
  dedupeHash: string
  /** ISO country code of the opening (null when the source does not say). */
  country: string | null
  city: string | null
  contentHash: string
}

const REMOTE_ONLY = /^\s*(remote|anywhere|work from home|wfh)(\s*[-,(]\s*(india|apac|asia)\)?)?\s*$/i

/** Whether an indiaOnly feed should import this posting. */
export function isIndiaPosting(p: FeedPosting): boolean {
  const cc = toCountryCode(p.country)
  if (cc === "IN") return true
  if (cc && p.workplaceType !== "remote") return false
  const all = [p.location, ...p.locations].filter(Boolean) as string[]
  if (all.some(isIndiaLocation)) return true
  return all.length > 0 && all.every((l) => REMOTE_ONLY.test(l))
}

/**
 * Careers pages of Indian companies often omit the location; a job with no
 * location at all is kept for them (it is reviewed when it came from the LLM).
 */
function passesIndiaFilter(p: FeedPosting, ctx: FeedContext): boolean {
  if (!ctx.indiaOnly) return true
  if (ctx.provider === "CAREER_PAGE" && !p.location && p.locations.length === 0) return true
  return isIndiaPosting(p)
}

export function buildJobFields(p: FeedPosting, ctx: FeedContext): FeedJobFields {
  const title = p.title.replace(/\s+/g, " ").slice(0, 200)
  const description = p.descriptionText ? p.descriptionText.slice(0, DESCRIPTION_MAX) : null
  const indiaLocations = [p.location, ...p.locations].filter((l): l is string => !!l && (!ctx.indiaOnly || isIndiaLocation(l)))
  const location = normalizeLocation([...new Set(indiaLocations.length ? indiaLocations : [p.location || ""])].join(", "))
  const remotePolicy = detectRemotePolicy(p.workplaceType, p.location, title)
  const structured = structuredSalaryINR(p.salary)
  const parsed = structured.min != null || structured.max != null ? structured : parseSalaryINR(description?.slice(0, 4000))
  const exp = parseExperience(`${title}\n${p.experienceHint || ""}\n${description?.slice(0, 6000) || ""}`)
  const geo = parseLocation(p.location || p.locations[0] || null, { country: p.country, city: p.city })
  const proofUrl = ctx.boardUrl
  const trust = computeTrustScore({
    applicationUrl: p.applyUrl,
    proofUrl,
    companyWebsite: ctx.company.website,
    companyVerified: ctx.company.verified,
    description,
  })
  const fields: Omit<FeedJobFields, "contentHash"> = {
    title,
    description,
    location,
    remotePolicy,
    type: detectJobType(p.commitment, title),
    category: p.department ? p.department.slice(0, 100) : null,
    skills: extractPostingSkills(title, description || ""),
    salary: salaryLabel(parsed.min, parsed.max),
    salaryMin: parsed.min,
    salaryMax: parsed.max,
    experience: experienceLabel(exp.min, exp.max),
    expMin: exp.min,
    expMax: exp.max,
    isFresherFriendly: isFresherFriendly(title, exp),
    applicationUrl: p.applyUrl,
    sourceUrl: p.applyUrl,
    proofUrl,
    trustScore: trust.score,
    dedupeHash: dedupeHash(ctx.company.name, title, location),
    country: geo.country,
    city: geo.city,
  }
  return { ...fields, contentHash: contentHashOf(fields as unknown as Record<string, unknown>) }
}

export interface ExistingFeedJob {
  id: string
  externalId: string | null
  contentHash: string | null
  status: string
  closedAt: Date | null
}

export interface SyncPlan {
  creates: { externalId: string; fields: FeedJobFields; postedAt: Date | null; confidence: number | null }[]
  updates: { id: string; fields: FeedJobFields }[]
  /** Existing jobs the source still lists (refresh lastSeenAt / expiry). */
  seenIds: string[]
  /** Jobs this sync closed earlier that the source lists again. */
  reopenIds: string[]
  /** Live jobs the source no longer lists. */
  missingIds: string[]
  skipped: number
  overflow: number
  /** Set when the circuit breaker refuses to count misses this run. */
  held: string | null
}

/** Pure diff of what the source says now vs. what we have; no I/O so it is unit-testable. */
export function planFeedSync(
  postings: FeedPosting[],
  existing: ExistingFeedJob[],
  ctx: FeedContext,
  opts: { force?: boolean } = {}
): SyncPlan {
  const byExternal = new Map(existing.filter((e) => e.externalId).map((e) => [e.externalId as string, e]))
  const plan: SyncPlan = { creates: [], updates: [], seenIds: [], reopenIds: [], missingIds: [], skipped: 0, overflow: 0, held: null }
  const seenExternal = new Set<string>()

  for (const p of postings) {
    if (seenExternal.has(p.externalId)) continue
    seenExternal.add(p.externalId)
    if (!passesIndiaFilter(p, ctx)) {
      plan.skipped++
      continue
    }
    const fields = buildJobFields(p, ctx)
    const current = byExternal.get(p.externalId)
    if (!current) {
      if (plan.creates.length >= MAX_CREATES_PER_RUN) plan.overflow++
      else plan.creates.push({ externalId: p.externalId, fields, postedAt: p.postedAt, confidence: p.confidence ?? null })
      continue
    }
    plan.seenIds.push(current.id)
    if (current.contentHash !== fields.contentHash) plan.updates.push({ id: current.id, fields })
    if (current.status === "EXPIRED" && current.closedAt) plan.reopenIds.push(current.id)
  }

  // Postings filtered out as non-India still count as "listed", so they are not closed as missing.
  const listed = seenExternal
  const live = existing.filter((e) => e.status === "ACTIVE")
  plan.missingIds = live.filter((e) => !e.externalId || !listed.has(e.externalId)).map((e) => e.id)

  if (opts.force) {
    // An admin confirmed the drop is real: count the misses (an empty fetch still never closes).
    if (postings.length === 0 && live.length > 0) plan.held = "Source returned no postings - not closing anything"
  } else if (postings.length === 0 && live.length > 0) {
    plan.held = "Source returned no postings while we have live jobs - not closing anything this run"
  } else if (live.length >= 4 && plan.missingIds.length > Math.max(3, live.length * MAX_CLOSE_SHARE)) {
    plan.held = `Source dropped ${plan.missingIds.length} of ${live.length} live jobs at once - held for review`
  }
  if (plan.held) plan.missingIds = []
  return plan
}

/** Public link to a feed's source (board page or careers page). */
export function feedPublicUrl(f: { provider: string; boardToken: string; pageUrl: string | null }): string {
  return f.provider === "CAREER_PAGE" ? f.pageUrl || "" : feedBoardUrl(f.provider as FeedProvider, f.boardToken)
}

const SLUG_PREFIX: Record<FeedSource, string> = {
  GREENHOUSE: "gh",
  LEVER: "lv",
  ASHBY: "ab",
  SMARTRECRUITERS: "sr",
  WORKABLE: "wk",
  RECRUITEE: "rc",
  PERSONIO: "pe",
  BREEZY: "bz",
  CAREER_PAGE: "cp",
}

export function feedJobSlug(title: string, companyName: string, provider: FeedSource, externalId: string): string {
  const tail = slugify(externalId).slice(-12) || "job"
  return [slugify(title).slice(0, 80), slugify(companyName).slice(0, 40), `${SLUG_PREFIX[provider]}${tail}`]
    .filter(Boolean)
    .join("-")
}

/**
 * Moderation for a new posting: structured sources go live; LLM-extracted ones
 * go live only when auto-publish is on and the model is confident enough.
 */
export function moderationForCreate(confidence: number | null, settings: Pick<FeedSettings, "autoPublishAi" | "minConfidence">) {
  if (confidence == null) return "APPROVED" as const
  return settings.autoPublishAi && confidence >= settings.minConfidence ? ("APPROVED" as const) : ("PENDING" as const)
}

export interface FeedRunStats {
  fetched: number
  created: number
  /** New LLM-extracted postings waiting in Content verification. */
  pendingReview: number
  updated: number
  unchanged: number
  reopened: number
  closed: number
  duplicates: number
  skipped: number
  overflow: number
}

export interface FeedRunResult {
  feedId: string
  status: "OK" | "HELD" | "ERROR" | "DEFERRED"
  message: string | null
  stats: FeedRunStats
  /** How the source was read (careers pages: jsonld / ats / ai / unchanged / none). */
  method?: string
  aiUsed: boolean
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

const emptyStats = (): FeedRunStats => ({
  fetched: 0, created: 0, pendingReview: 0, updated: 0, unchanged: 0, reopened: 0, closed: 0, duplicates: 0, skipped: 0, overflow: 0,
})

const json = (v: unknown) => v as Prisma.InputJsonValue

/** Fetches one feed, applies the diff and records the run on the feed row. */
export async function syncFeed(
  feedId: string,
  opts: {
    now?: Date
    fetchImpl?: FetchLike
    revalidate?: boolean
    force?: boolean
    /** Careers pages: whether this run may spend a Gemini call. */
    allowAi?: boolean
    settings?: FeedSettings
  } = {}
): Promise<FeedRunResult> {
  const now = opts.now ?? new Date()
  const settings = opts.settings ?? (await getFeedSettings())
  const feed = await prisma.privateJobFeed.findUnique({ where: { id: feedId }, include: { company: true } })
  if (!feed) throw new FeedError("Feed not found", 404)
  const isPage = feed.provider === "CAREER_PAGE"
  const ctx: FeedContext = {
    id: feed.id,
    provider: feed.provider,
    boardToken: feed.boardToken,
    boardUrl: isPage ? feed.pageUrl || "" : feedBoardUrl(feed.provider as FeedProvider, feed.boardToken),
    indiaOnly: feed.indiaOnly,
    createdById: feed.createdById,
    company: {
      id: feed.company.id,
      name: feed.company.name,
      website: feed.company.website,
      verified: feed.company.verifiedStatus === "VERIFIED",
    },
  }
  const stats = emptyStats()
  const expiresAt = new Date(now.getTime() + FEED_EXPIRY_DAYS * 86_400_000)

  let postings: FeedPosting[]
  let method: string | undefined
  let note: string | null = null
  let aiUsed = false
  let pageHash: string | null | undefined
  try {
    if (isPage) {
      const page = await readCareerPage(feed.pageUrl || "", {
        companyName: feed.company.name,
        // Only trust the stored hash when the last read succeeded.
        previousHash: opts.force || feed.lastStatus !== "OK" ? null : feed.pageHash,
        allowAi: opts.allowAi !== false,
        model: settings.geminiModel,
        fetchImpl: opts.fetchImpl,
      })
      method = page.method
      note = page.note
      aiUsed = page.aiUsed
      pageHash = page.pageHash
      if (page.deferred) {
        // Not recorded as a run: the feed stays due and is picked up by the next call.
        return { feedId: feed.id, status: "DEFERRED", message: page.note, stats, method, aiUsed }
      }
      if (page.method === "unchanged") {
        const r = await prisma.privateJob.updateMany({
          where: { feedId: feed.id, status: "ACTIVE" },
          data: { lastSeenAt: now, feedMisses: 0, expiresAt },
        })
        stats.unchanged = r.count
        await prisma.privateJobFeed.update({
          where: { id: feed.id },
          data: { lastRunAt: now, lastStatus: "OK", lastError: note, lastStats: json({ ...stats, method }) },
        })
        return { feedId: feed.id, status: "OK", message: note, stats, method, aiUsed }
      }
      postings = page.postings
    } else {
      postings = await fetchFeed(feed.provider as FeedProvider, feed.boardToken, opts.fetchImpl)
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Fetch failed"
    if (e instanceof FeedError && e.status === 429) {
      // Rate-limited by the job board: not a failure, and nothing is closed. lastRunAt stays, so the next cron retries.
      await prisma.privateJobFeed.update({ where: { id: feed.id }, data: { lastError: "Job board asked us to slow down (HTTP 429); retrying on the next run" } })
      return { feedId: feed.id, status: "DEFERRED", message: "Rate-limited by the job board; retrying on the next run", stats, method, aiUsed }
    }
    await prisma.privateJobFeed.update({
      where: { id: feed.id },
      data: { lastRunAt: now, lastStatus: "ERROR", lastError: message.slice(0, 500), lastStats: json({ ...stats, method }) },
    })
    return { feedId: feed.id, status: "ERROR", message, stats, method, aiUsed }
  }
  stats.fetched = postings.length

  const existing = await prisma.privateJob.findMany({
    where: { feedId: feed.id },
    select: { id: true, externalId: true, contentHash: true, status: true, closedAt: true },
  })
  // SmartRecruiters lists postings without descriptions: fetch them for new in-scope postings
  // (capped per run; the rest are created on the next runs, so every job page has its description).
  let deferredNew = 0
  if (feed.provider === "SMARTRECRUITERS") {
    const known = new Set(existing.map((e) => e.externalId))
    const fresh = postings.filter((p) => !known.has(p.externalId) && passesIndiaFilter(p, ctx))
    const batch = fresh.slice(0, SMARTRECRUITERS_DETAILS_PER_RUN)
    await enrichSmartRecruiters(feed.boardToken, batch, opts.fetchImpl, { max: batch.length })
    const now = new Set(batch.map((p) => p.externalId))
    deferredNew = fresh.length - batch.length
    postings = postings.filter((p) => known.has(p.externalId) || now.has(p.externalId) || !passesIndiaFilter(p, ctx))
  }

  const plan = planFeedSync(postings, existing, ctx, { force: opts.force })
  stats.skipped = plan.skipped
  stats.overflow = plan.overflow + deferredNew

  // Cross-source duplicates: the same opening already live from another source (e.g. posted by hand).
  let creates = plan.creates
  if (creates.length) {
    const dupes = await prisma.privateJob.findMany({
      where: {
        dedupeHash: { in: creates.map((c) => c.fields.dedupeHash) },
        status: "ACTIVE",
        OR: [{ feedId: null }, { feedId: { not: feed.id } }],
      },
      select: { dedupeHash: true },
    })
    const dupeSet = new Set(dupes.map((d) => d.dedupeHash))
    creates = creates.filter((c) => !dupeSet.has(c.fields.dedupeHash))
    stats.duplicates = plan.creates.length - creates.length
  }

  for (const batch of chunks(creates, 200)) {
    const rows = batch.map(({ externalId, fields, postedAt, confidence }) => {
      const moderation = moderationForCreate(confidence, settings)
      return {
        ...fields,
        slug: feedJobSlug(fields.title, ctx.company.name, ctx.provider, externalId),
        companyId: ctx.company.id,
        externalId,
        feedId: feed.id,
        source: "ATS_FEED" as const,
        status: "ACTIVE",
        // A super admin vetted the feed; LLM postings may still need a human look (moderationForCreate).
        moderation,
        reviewedAt: moderation === "APPROVED" ? now : null,
        reviewNote: confidence != null ? `AI-extracted from ${ctx.boardUrl} (confidence ${Math.round(confidence * 100)}%)` : null,
        aiConfidence: confidence,
        createdById: ctx.createdById,
        lastSeenAt: now,
        expiresAt,
        createdAt: postedAt && postedAt <= now && postedAt.getTime() > now.getTime() - 180 * 86_400_000 ? postedAt : now,
      }
    })
    const res = await prisma.privateJob.createMany({ data: rows, skipDuplicates: true })
    stats.created += res.count
    stats.pendingReview += rows.filter((r) => r.moderation === "PENDING").length
  }

  for (const batch of chunks(plan.updates, 10)) {
    await Promise.all(batch.map((u) => prisma.privateJob.update({ where: { id: u.id }, data: u.fields })))
  }
  stats.updated = plan.updates.length
  stats.unchanged = plan.seenIds.length - plan.updates.length

  for (const ids of chunks(plan.seenIds, 5000)) {
    await prisma.privateJob.updateMany({ where: { id: { in: ids } }, data: { lastSeenAt: now, feedMisses: 0, expiresAt } })
  }
  for (const ids of chunks(plan.reopenIds, 5000)) {
    const r = await prisma.privateJob.updateMany({ where: { id: { in: ids } }, data: { status: "ACTIVE", closedAt: null } })
    stats.reopened += r.count
  }
  for (const ids of chunks(plan.missingIds, 5000)) {
    await prisma.privateJob.updateMany({ where: { id: { in: ids } }, data: { feedMisses: { increment: 1 } } })
  }
  if (plan.missingIds.length) {
    const r = await prisma.privateJob.updateMany({
      where: { feedId: feed.id, status: "ACTIVE", feedMisses: { gte: FEED_MISSES_TO_CLOSE } },
      data: { status: "EXPIRED", closedAt: now },
    })
    stats.closed = r.count
  }

  const status = plan.held ? "HELD" : "OK"
  const message = plan.held ?? note
  await prisma.privateJobFeed.update({
    where: { id: feed.id },
    data: {
      lastRunAt: now,
      lastStatus: status,
      lastError: message,
      lastStats: json({ ...stats, method }),
      ...(pageHash !== undefined ? { pageHash } : {}),
    },
  })
  const changed = stats.created + stats.updated + stats.reopened + stats.closed > 0
  if (changed && opts.revalidate !== false) {
    try {
      revalidatePublicContent("private-job")
    } catch {
      // best-effort outside a request context
    }
  }
  return { feedId: feed.id, status, message, stats, method, aiUsed }
}

/**
 * Runs the feeds that are due, oldest first, within a time budget (fits a 60s
 * serverless call). Honours the super-admin settings: master switch, sync
 * interval and the number of careers pages read with Gemini per call.
 */
export async function runDueFeeds(opts: {
  now?: Date
  budgetMs?: number
  fetchImpl?: FetchLike
} = {}): Promise<{ ran: FeedRunResult[]; remaining: number; paused: boolean }> {
  const started = Date.now()
  const now = opts.now ?? new Date()
  const settings = await getFeedSettings()
  if (!settings.enabled) return { ran: [], remaining: 0, paused: true }
  const budget = opts.budgetMs ?? 45_000
  const dueBefore = new Date(now.getTime() - settings.intervalHours * 3_600_000)
  const due = await prisma.privateJobFeed.findMany({
    where: { enabled: true, OR: [{ lastRunAt: null }, { lastRunAt: { lt: dueBefore } }] },
    orderBy: [{ lastRunAt: { sort: "asc", nulls: "first" } }],
    select: { id: true, provider: true },
    take: 300,
  })
  const ran: FeedRunResult[] = []
  let aiPages = 0
  let aiBusy = false
  const queue = [...due]
  const worker = async () => {
    for (let f = queue.shift(); f; f = queue.shift()) {
      const elapsed = Date.now() - started
      if (elapsed > budget) return
      const isPage = f.provider === "CAREER_PAGE"
      // An LLM read takes ~5-20 s: leave room for it, and read careers pages one at a time.
      if (isPage && (elapsed > budget - 20_000 || aiBusy)) continue
      if (isPage) aiBusy = true
      try {
        const r = await syncFeed(f.id, {
          now,
          fetchImpl: opts.fetchImpl,
          revalidate: false,
          settings,
          allowAi: aiPages < settings.maxAiPagesPerRun,
        })
        if (r.aiUsed) aiPages++
        ran.push(r)
      } catch (e) {
        ran.push({ feedId: f.id, status: "ERROR", message: e instanceof Error ? e.message : "Sync failed", stats: emptyStats(), aiUsed: false })
      } finally {
        if (isPage) aiBusy = false
      }
    }
  }
  await Promise.all(Array.from({ length: FEED_CONCURRENCY }, worker))
  if (ran.some((r) => r.stats.created + r.stats.updated + r.stats.reopened + r.stats.closed > 0)) {
    try {
      revalidatePublicContent("private-job")
    } catch {
      // best-effort
    }
  }
  const finished = ran.filter((r) => r.status !== "DEFERRED").length
  return { ran, remaining: due.length - finished, paused: false }
}
