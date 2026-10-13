/**
 * Pure popularity math for the trending engine.
 * All functions are deterministic and side-effect free so the formula
 * can be unit-tested and tuned without touching DB code.
 */

export const DAY_MS = 86_400_000

/** Scale-invariant view term: 0 -> 0, 10 -> ~2.4, 100 -> ~4.6, 1000 -> ~6.9 */
export function viewTerm(views: number): number {
  return Math.log1p(Math.max(0, views))
}

/**
 * Exponential freshness decay. Future-dated items (upcoming) count as
 * fully fresh. `halfLifeDays` controls per-module velocity.
 */
export function freshnessTerm(nowMs: number, date: Date | string | null | undefined, halfLifeDays: number): number {
  if (!date) return 0
  const t = new Date(date).getTime()
  if (Number.isNaN(t)) return 0
  const ageDays = (nowMs - t) / DAY_MS
  if (ageDays < 0) return 1
  return Math.exp((-ageDays * Math.LN2) / halfLifeDays)
}

/**
 * Deadline urgency boost: 0 when past or further than windowDays out,
 * scaling linearly up to `weight` as the date approaches.
 */
export function urgencyTerm(
  nowMs: number,
  target: Date | string | null | undefined,
  windowDays: number,
  weight: number
): number {
  if (!target || weight === 0 || windowDays <= 0) return 0
  const t = new Date(target).getTime()
  if (Number.isNaN(t)) return 0
  const msLeft = t - nowMs
  if (msLeft <= 0 || msLeft > windowDays * DAY_MS) return 0
  return weight * (1 - msLeft / (windowDays * DAY_MS))
}

/** Flat penalty when the key date already passed (stale result/admit card). */
export function staleTerm(target: Date | string | null | undefined, nowMs: number, penalty: number): number {
  if (!target || penalty === 0) return 0
  const t = new Date(target).getTime()
  if (Number.isNaN(t)) return 0
  return t < nowMs ? -penalty : 0
}

export interface EngagementSignals {
  views: number
  bookmarks: number
  clicks: number
}

export function engagementScore(s: EngagementSignals, viewsWeight: number, bookmarkWeight: number, clickWeight: number): number {
  return viewsWeight * viewTerm(s.views) + bookmarkWeight * Math.max(0, s.bookmarks) + clickWeight * Math.max(0, s.clicks)
}

/** True when no engagement exists at all - caller should widen window or fall back to latest. */
export function isCold(signals: EngagementSignals[]): boolean {
  return signals.every((s) => s.views <= 0 && s.bookmarks <= 0 && s.clicks <= 0)
}
