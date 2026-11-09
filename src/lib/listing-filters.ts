/** Shared parsing helpers for public listing filter query params. */

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function buildDateRange(
  from: string | null | undefined,
  to: string | null | undefined
): { gte?: Date; lte?: Date } | undefined {
  const start = parseIsoDate(from)
  const end = parseIsoDate(to)
  if (!start && !end) return undefined
  return {
    ...(start ? { gte: start } : {}),
    ...(end ? { lte: end } : {}),
  }
}

/** Returns the date `days` days ago (used for "posted within"). */
export function postedSince(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

/** Returns the date `days` days from now (used for "closing soon"). */
export function dateInDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

export function parseNumber(value: string | null | undefined, fallback = 0): number {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/** Parses postedWithin presets: 1 = today, 7 = this week, 30 = this month. */
export function parsePostedWithin(value: string | null | undefined): number {
  const days = parseNumber(value, 0)
  return [1, 7, 30].includes(days) ? days : 0
}
