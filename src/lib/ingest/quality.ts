import type { IngestKind } from "./types"
import { normForMatch } from "./grounding"
import { isOfficialUrl, todayIST } from "./normalize"

/**
 * Content-quality rules written around Google's publisher and spam policies
 * (AdSense "valuable inventory", Search "scaled content abuse" / thin pages):
 *  - every page must carry real, specific facts a reader needs
 *  - the overview is written in our own words, not copied from the notice
 *  - pages that cannot meet the bar are never auto-published and stay out of the index
 */

export const SUBSTANTIVE_JOB_FIELDS = [
  "totalVacancies", "education", "ageLimit", "applicationFee", "selectionProcess",
  "salary", "howToApply", "importantDates", "lastDate",
] as const

type JobLike = Partial<Record<(typeof SUBSTANTIVE_JOB_FIELDS)[number] | "summary", unknown>>

function filled(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === "string") return v.trim().length > 0
  if (v instanceof Date) return !Number.isNaN(v.getTime())
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === "object") return Object.keys(v as object).length > 0
  return true
}

/** Number of substantive facts on a job page. */
export function substantiveCount(job: JobLike): number {
  return SUBSTANTIVE_JOB_FIELDS.filter((f) => filled(job[f])).length
}

/**
 * A job page too thin to deserve indexing (and ad impressions): fewer than three
 * hard facts and no written overview. Used for robots `noindex` + sitemap exclusion.
 */
export function isThinJob(job: JobLike): boolean {
  const summaryLen = typeof job.summary === "string" ? job.summary.trim().length : 0
  return substantiveCount(job) < 3 && summaryLen < 160
}

/** Word 6-gram shingles. */
function shingles(text: string, n = 6): Set<string> {
  const words = normForMatch(text).split(" ").filter(Boolean)
  const out = new Set<string>()
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(" "))
  return out
}

/**
 * Share of the summary's 6-word sequences that also occur in the source.
 * High overlap = copied text (duplicate content); our overviews must stay low.
 */
export function copiedRatio(summary: string, source: string): number {
  const a = shingles(summary)
  if (!a.size) return 0
  const b = shingles(source)
  let hit = 0
  for (const s of a) if (b.has(s)) hit++
  return hit / a.size
}

export const MAX_COPIED_RATIO = 0.35
export const MIN_SUMMARY_CHARS = 160

export interface QualityInput {
  kind: IngestKind
  title: string | null
  department: string | null
  summary: string | null
  lastDate: string | null
  officialNotification: string
  applyLink: string | null
  officialWebsite: string | null
  allowHosts?: string[]
  facts: JobLike
  sourceText: string
  grounded: boolean
  verifiedRatio: number
  llmConfidence: number
}

export interface QualityReport {
  /** 0..100 */
  score: number
  /** Post must not be stored at all (expired / unusable). */
  reject: string | null
  /** Reasons the post needs a human (empty = eligible for auto-approve). */
  flags: string[]
  /** Combined 0..1 confidence used by the auto-approve policy. */
  confidence: number
}

export function assessQuality(q: QualityInput, today: string = todayIST()): QualityReport {
  const flags: string[] = []
  if (!q.title || q.title.length < 12) return { score: 0, reject: "missing or too-short title", flags, confidence: 0 }
  if (!q.department) return { score: 0, reject: "missing department", flags, confidence: 0 }
  if (!isOfficialUrl(q.officialNotification, q.allowHosts)) return { score: 0, reject: "notification is not on an official domain", flags, confidence: 0 }
  if (q.kind === "jobs" && q.lastDate && q.lastDate < today) return { score: 0, reject: "deadline already passed", flags, confidence: 0 }

  let score = 0
  const facts = q.kind === "jobs" ? substantiveCount(q.facts) : 0
  if (q.kind === "jobs") {
    score += Math.min(facts, 7) * 8 // up to 56
    if (!q.lastDate) flags.push("no last date")
    if (facts < 3) flags.push("thin: fewer than 3 facts")
  } else {
    score += 40
  }

  const summary = q.summary?.trim() ?? ""
  if (summary.length >= MIN_SUMMARY_CHARS) {
    const copied = q.sourceText ? copiedRatio(summary, q.sourceText) : 0
    if (copied > MAX_COPIED_RATIO) flags.push(`overview copies the notice (${Math.round(copied * 100)}%)`)
    else score += 24
  } else {
    flags.push("overview missing or too short")
  }

  for (const [name, link] of [["apply link", q.applyLink], ["official website", q.officialWebsite]] as const) {
    if (link && !isOfficialUrl(link, q.allowHosts)) flags.push(`${name} is not an official domain`)
  }

  if (!q.grounded) flags.push("scanned notice - facts not machine-verified")
  else score += Math.round(q.verifiedRatio * 20)
  if (q.grounded && q.verifiedRatio < 0.75) flags.push("several facts could not be verified")

  const confidence = Math.max(0, Math.min(1, (q.grounded ? 0.5 + q.verifiedRatio * 0.5 : 0.4) * (0.5 + q.llmConfidence * 0.5)))
  if (confidence < 0.6) flags.push("low confidence")
  return { score: Math.min(100, score), reject: null, flags, confidence }
}
