/**
 * Trending engine configuration.
 * One popularity formula per home module, tuned weights per content type.
 * No ML, no per-user state - pure engagement + freshness ranking.
 */

export const TRENDING_WINDOW_DAYS = 7
export const FALLBACK_WINDOW_DAYS = 30

/** Max candidates pulled from DB before in-memory scoring (home needs <= 9). */
export const CANDIDATE_POOL_SIZE = 200

export type TrendingModule =
  | "jobs"
  | "results"
  | "admit-cards"
  | "answer-keys"
  | "syllabus"
  | "admissions"
  | "private-jobs"
  | "blog"
  | "exams"

export const TRENDING_MODULES: TrendingModule[] = [
  "jobs",
  "results",
  "admit-cards",
  "answer-keys",
  "syllabus",
  "admissions",
  "private-jobs",
  "blog",
]

/** PageViewEvent.entityType values written by EntityViewTracker. */
export const ENTITY_TYPE: Record<Exclude<TrendingModule, "exams">, string> = {
  jobs: "JOB",
  "private-jobs": "PRIVATE_JOB",
  results: "RESULT",
  "admit-cards": "ADMIT_CARD",
  "answer-keys": "ANSWER_KEY",
  syllabus: "SYLLABUS",
  admissions: "ADMISSION",
  blog: "BLOG",
}

export interface ModuleScoring {
  /** Freshness exponential half-life in days (per content velocity). */
  halfLifeDays: number
  /** Weight of log1p(window views). */
  viewsWeight: number
  /** Weight per bookmark in window (linear, counts are small). */
  bookmarkWeight: number
  /** Weight per apply/detail/outbound click in window. */
  clickWeight: number
  /** Weight of freshness term (0..1 scaled). */
  freshnessWeight: number
  /** Deadline/event urgency window + weight. */
  urgencyWindowDays: number
  urgencyWeight: number
  /** Penalty subtracted when the key date already passed. */
  stalePenalty: number
  /** Weight of log1p(totalVacancies) - jobs only. */
  vacancyWeight: number
  /** Weight of trustScore/100 - private jobs only. */
  trustWeight: number
}

const base: ModuleScoring = {
  halfLifeDays: 14,
  viewsWeight: 3,
  bookmarkWeight: 2,
  clickWeight: 1.5,
  freshnessWeight: 1,
  urgencyWindowDays: 14,
  urgencyWeight: 1.5,
  stalePenalty: 2,
  vacancyWeight: 0,
  trustWeight: 0,
}

export const MODULE_SCORING: Record<Exclude<TrendingModule, "exams">, ModuleScoring> = {
  jobs: { ...base, halfLifeDays: 14, vacancyWeight: 0.8 },
  results: { ...base, halfLifeDays: 10, urgencyWindowDays: 30, urgencyWeight: 1 },
  "admit-cards": { ...base, halfLifeDays: 10, urgencyWindowDays: 30, urgencyWeight: 2 },
  "answer-keys": { ...base, halfLifeDays: 14 },
  syllabus: { ...base, halfLifeDays: 60, freshnessWeight: 0.5 },
  admissions: { ...base, halfLifeDays: 14, vacancyWeight: 0, urgencyWeight: 1.5 },
  "private-jobs": { ...base, halfLifeDays: 14, trustWeight: 1 },
  blog: { ...base, halfLifeDays: 30, freshnessWeight: 0.8, urgencyWeight: 0, stalePenalty: 0 },
}

/** Human-readable metadata for the TrendingNow strip. */
export const MODULE_META: Record<TrendingModule, { label: string; href: string }> = {
  jobs: { label: "Gov Jobs", href: "/jobs" },
  results: { label: "Results", href: "/results" },
  "admit-cards": { label: "Admit Cards", href: "/admit-cards" },
  "answer-keys": { label: "Answer Keys", href: "/answer-keys" },
  syllabus: { label: "Syllabus", href: "/syllabus" },
  admissions: { label: "Admissions", href: "/admissions" },
  "private-jobs": { label: "Private Jobs", href: "/private-jobs" },
  blog: { label: "Blog", href: "/blog" },
  exams: { label: "Exams", href: "/jobs" },
}
