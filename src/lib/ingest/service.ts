/**
 * Server side of the ingest bot: takes extracted posts from the scraper,
 * re-verifies them, applies the quality + duplicate gates and stores them
 * through the same import engine the admin bulk upload uses.
 */
import { prisma } from "@/lib/prisma"
import { revalidatePublicContent } from "@/lib/cache"
import { writeAuditLog } from "@/lib/moderation"
import { importContent, REVALIDATE_KIND, type ContentModule, type RowOutcome } from "@/lib/bulk-upload/import"
import type { IngestPost } from "./schema"
import type { IngestKind } from "./types"
import { groundExtraction } from "./grounding"
import { assessQuality, type QualityReport } from "./quality"
import { autoApproveConfig, canAutoApprove } from "./policy"
import { contentHash, jaccard, titleTokens, todayIST, urlHash } from "./normalize"

export const INGEST_BOT_EMAIL = "ingest-bot@chayanjobs.internal"

const ENTITY_FOR_KIND: Record<IngestKind, string> = {
  jobs: "Job",
  results: "Result",
  "admit-cards": "AdmitCard",
  "answer-keys": "AnswerKey",
  admissions: "Admission",
  syllabus: "Syllabus",
}

export type ItemStatus = "POSTED" | "SKIPPED" | "DUPLICATE" | "FAILED"

export interface ItemResult {
  sourceUrl: string
  status: ItemStatus
  reason?: string
  entityId?: string
  moderation?: "APPROVED" | "PENDING"
  quality?: number
}

/**
 * The bot account that owns ingested posts. Role ADMIN so its posts land in the
 * existing super-admin review queue (which lists ADMIN uploads). It has no
 * password and no OAuth account on a non-routable domain, so nobody can sign in as it.
 */
export async function ensureBotUser(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: INGEST_BOT_EMAIL },
    update: { role: "ADMIN", password: null },
    create: { email: INGEST_BOT_EMAIL, name: "ChayanJobs Ingest Bot", role: "ADMIN" },
    select: { id: true },
  })
  return user.id
}

/** Of the given URLs, those not yet processed (failed ones are retried up to 3 times). */
export async function filterUnseen(urls: string[]): Promise<string[]> {
  const byHash = new Map(urls.map((u) => [urlHash(u), u]))
  const rows = await prisma.ingestItem.findMany({
    where: { urlHash: { in: [...byHash.keys()] } },
    select: { urlHash: true, status: true, attempts: true },
  })
  const done = new Set(rows.filter((r) => r.status !== "FAILED" || r.attempts >= 3).map((r) => r.urlHash))
  return [...byHash.entries()].filter(([h]) => !done.has(h)).map(([, u]) => u)
}

function locationLabel(p: IngestPost): string {
  if (p.level === "DISTRICT" && p.district && p.state) return `${p.district}, ${p.state}`
  if (p.level === "STATE" && p.state) return p.state
  return "All India"
}

/** Maps a verified extraction onto the bulk-upload row keys of its module. */
export function toImportRow(p: IngestPost, ex: IngestPost["extraction"], category: string, today: string): Record<string, unknown> {
  const common = {
    title: ex.title,
    department: ex.department,
    category,
    status: "PUBLISHED",
  }
  const dates = ex.importantDates?.length ? Object.fromEntries(ex.importantDates.map((r) => [r.label, r.date])) : null
  switch (ex.kind) {
    case "jobs":
      return {
        ...common,
        status: ex.startDate && ex.startDate > today ? "UPCOMING" : "ACTIVE",
        jobLevel: p.level,
        state: p.level === "CENTRAL" ? undefined : p.state ?? undefined,
        district: p.level === "DISTRICT" ? p.district ?? undefined : undefined,
        location: locationLabel(p),
        advertisementNo: ex.advertisementNo,
        totalVacancies: ex.totalVacancies,
        salary: ex.salary,
        ageLimit: ex.ageLimit,
        ageRelaxation: ex.ageRelaxation,
        education: ex.education,
        experience: ex.experience,
        selectionProcess: ex.selectionProcess,
        applicationFee: ex.applicationFee,
        documentsRequired: ex.documentsRequired,
        howToApply: ex.howToApply,
        importantDates: dates,
        officialNotification: p.officialNotification,
        officialWebsite: ex.officialWebsite,
        applyLink: ex.applyLink,
        startDate: ex.startDate,
        lastDate: ex.lastDate,
        summary: ex.summary,
      }
    case "results":
      return { ...common, description: ex.summary, pdfUrl: p.officialNotification, resultDate: ex.resultDate }
    case "admit-cards":
      return { ...common, description: ex.summary, downloadUrl: ex.applyLink ?? p.officialNotification, examDate: ex.examDate }
    case "answer-keys":
      return { ...common, description: ex.summary, pdfUrl: p.officialNotification }
    case "admissions":
      return {
        ...common,
        description: ex.summary,
        applicationFee: ex.applicationFee,
        startDate: ex.startDate,
        lastDate: ex.lastDate,
        pdfUrl: p.officialNotification,
      }
    case "syllabus":
      return { ...common, description: ex.summary, pdfUrl: p.officialNotification }
    default:
      return common
  }
}

/** Picks an existing category (never invents one) so the taxonomy stays clean. */
export function resolveCategory(wanted: string | null, level: IngestPost["level"], existing: string[]): string | null {
  const lower = new Map(existing.map((c) => [c.trim().toLowerCase(), c]))
  if (wanted && lower.has(wanted.trim().toLowerCase())) return lower.get(wanted.trim().toLowerCase())!
  const fallback = level === "CENTRAL" ? ["central govt", "central government"] : ["state govt", "state government"]
  for (const f of fallback) if (lower.has(f)) return lower.get(f)!
  return existing[0] ?? null
}

interface Prepared {
  index: number
  post: IngestPost
  kind: IngestKind
  row: Record<string, unknown>
  hash: string
  quality: QualityReport
}

const RECENT_DAYS = 120

async function recentTitles(kind: IngestKind): Promise<Set<string>[]> {
  const since = new Date(Date.now() - RECENT_DAYS * 86400_000)
  const where = { createdAt: { gte: since } }
  const select = { title: true } as const
  const rows =
    kind === "jobs" ? await prisma.job.findMany({ where, select, take: 5000 })
    : kind === "results" ? await prisma.result.findMany({ where, select, take: 5000 })
    : kind === "admit-cards" ? await prisma.admitCard.findMany({ where, select, take: 5000 })
    : kind === "answer-keys" ? await prisma.answerKey.findMany({ where, select, take: 5000 })
    : kind === "admissions" ? await prisma.admission.findMany({ where, select, take: 5000 })
    : await prisma.syllabus.findMany({ where, select, take: 5000 })
  return rows.map((r) => titleTokens(r.title))
}

/** Near-identical title already published recently ⇒ duplicate page. */
export const NEAR_DUPLICATE_THRESHOLD = 0.88

export async function ingestBatch(posts: IngestPost[], now: Date = new Date()): Promise<ItemResult[]> {
  const today = todayIST(now)
  const results: ItemResult[] = posts.map((p) => ({ sourceUrl: p.sourceUrl, status: "FAILED" as ItemStatus }))
  const meta: { hash?: string; quality?: QualityReport; kind?: string; entityId?: string; auto?: boolean }[] = posts.map(() => ({}))

  const [botId, categories] = await Promise.all([
    ensureBotUser(),
    prisma.category.findMany({ select: { name: true } }).then((r) => r.map((c) => c.name)),
  ])
  const cfg = autoApproveConfig()
  const startOfDay = new Date(`${today}T00:00:00+05:30`)
  let approvedToday = cfg.enabled ? await prisma.ingestItem.count({ where: { autoApproved: true, createdAt: { gte: startOfDay } } }) : 0

  // 1. Verify + score every post.
  const prepared: Prepared[] = []
  const batchHashes = new Set<string>()
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i]
    if (p.extraction.kind === "irrelevant") {
      results[i] = { sourceUrl: p.sourceUrl, status: "SKIPPED", reason: "not a recruitment / exam notice" }
      meta[i].kind = "irrelevant"
      continue
    }
    const kind = p.extraction.kind
    const grounded = p.sourceText.trim().length >= 200
    const g = grounded ? groundExtraction(p.extraction, p.sourceText, p.links) : { extraction: p.extraction, dropped: [], verifiedRatio: 0 }
    const ex = g.extraction
    const quality = assessQuality(
      {
        kind,
        title: ex.title,
        department: ex.department,
        summary: ex.summary,
        lastDate: ex.lastDate,
        officialNotification: p.officialNotification,
        applyLink: ex.applyLink,
        officialWebsite: ex.officialWebsite,
        allowHosts: p.allowHosts,
        facts: { ...ex, importantDates: ex.importantDates ?? undefined },
        sourceText: p.sourceText,
        grounded,
        verifiedRatio: g.verifiedRatio,
        llmConfidence: ex.confidence,
      },
      today,
    )
    meta[i].quality = quality
    meta[i].kind = kind
    if (quality.reject) {
      results[i] = { sourceUrl: p.sourceUrl, status: "SKIPPED", reason: quality.reject, quality: quality.score }
      continue
    }
    const category = resolveCategory(ex.category, p.level, categories)
    if (!category) {
      results[i] = { sourceUrl: p.sourceUrl, status: "FAILED", reason: "no categories exist yet - seed the database first" }
      continue
    }
    const hash = contentHash({ kind, department: ex.department, advertisementNo: ex.advertisementNo, title: ex.title!, lastDate: ex.lastDate })
    meta[i].hash = hash
    if (batchHashes.has(hash)) {
      results[i] = { sourceUrl: p.sourceUrl, status: "DUPLICATE", reason: "same notice twice in one batch" }
      continue
    }
    batchHashes.add(hash)
    prepared.push({ index: i, post: p, kind, row: toImportRow(p, ex, category, today), hash, quality })
  }

  // 2. Cross-source duplicates: same fingerprint already posted, or near-identical recent title.
  if (prepared.length) {
    const hits = await prisma.ingestItem.findMany({
      where: { contentHash: { in: prepared.map((x) => x.hash) }, status: "POSTED" },
      select: { contentHash: true },
    })
    const posted = new Set(hits.map((h) => h.contentHash))
    const titleCache = new Map<IngestKind, Set<string>[]>()
    for (const x of [...prepared]) {
      let reason: string | null = posted.has(x.hash) ? "already published from another source" : null
      if (!reason) {
        if (!titleCache.has(x.kind)) titleCache.set(x.kind, await recentTitles(x.kind))
        const mine = titleTokens(String(x.row.title))
        if (titleCache.get(x.kind)!.some((t) => jaccard(mine, t) >= NEAR_DUPLICATE_THRESHOLD)) reason = "near-identical post already exists"
      }
      if (reason) {
        results[x.index] = { sourceUrl: x.post.sourceUrl, status: "DUPLICATE", reason }
        prepared.splice(prepared.indexOf(x), 1)
      }
    }
  }

  // 3. Insert through the shared import engine, one call per module.
  const byKind = new Map<IngestKind, Prepared[]>()
  for (const x of prepared) byKind.set(x.kind, [...(byKind.get(x.kind) ?? []), x])
  const touched = new Set<IngestKind>()

  for (const [kind, group] of byKind) {
    const decisions = group.map((x) => {
      const auto = canAutoApprove(x.quality, cfg, approvedToday)
      if (auto) approvedToday++
      return auto ? ("APPROVED" as const) : ("PENDING" as const)
    })
    const counters = { newDepartments: 0, newCategories: 0 }
    await importContent(kind as ContentModule, group.map((x) => x.row), botId, counters, {
      moderation: (_row, i) => decisions[i],
      onRow: (i: number, outcome: RowOutcome) => {
        const x = group[i]
        if (outcome.status === "created") {
          results[x.index] = { sourceUrl: x.post.sourceUrl, status: "POSTED", entityId: outcome.id, moderation: decisions[i], quality: x.quality.score }
          meta[x.index].entityId = outcome.id
          meta[x.index].auto = decisions[i] === "APPROVED"
          if (decisions[i] === "APPROVED") touched.add(kind)
        } else if (outcome.status === "duplicate") {
          results[x.index] = { sourceUrl: x.post.sourceUrl, status: "DUPLICATE", reason: "same title or slug already exists" }
        } else {
          results[x.index] = { sourceUrl: x.post.sourceUrl, status: "FAILED", reason: outcome.message.slice(0, 300) }
        }
      },
    })
  }

  // 4. Remember every URL (dedupe for the next run + audit trail for reviewers).
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i]
    const r = results[i]
    const m = meta[i]
    const data = {
      sourceId: p.sourceId,
      url: p.sourceUrl,
      contentHash: m.hash ?? null,
      kind: m.kind ?? p.extraction.kind,
      status: r.status,
      reason: r.reason?.slice(0, 500) ?? (m.quality?.flags.length ? m.quality.flags.join("; ").slice(0, 500) : null),
      entityType: r.status === "POSTED" ? ENTITY_FOR_KIND[p.extraction.kind as IngestKind] : null,
      entityId: m.entityId ?? null,
      confidence: m.quality?.confidence ?? null,
      quality: m.quality?.score ?? null,
      autoApproved: Boolean(m.auto),
    }
    await prisma.ingestItem.upsert({
      where: { urlHash: urlHash(p.sourceUrl) },
      create: { ...data, urlHash: urlHash(p.sourceUrl) },
      update: { ...data, attempts: { increment: 1 } },
    })
  }

  for (const kind of touched) {
    try {
      revalidatePublicContent(REVALIDATE_KIND[kind as ContentModule])
    } catch {
      // best-effort outside a request scope
    }
  }

  const count = (s: ItemStatus) => results.filter((r) => r.status === s).length
  await writeAuditLog({
    action: "BULK_CREATE",
    entity: "IngestBatch",
    entityId: "ingest-bot",
    userId: botId,
    details: `Ingest batch: posted=${count("POSTED")} duplicate=${count("DUPLICATE")} skipped=${count("SKIPPED")} failed=${count("FAILED")}`,
  })
  return results
}
