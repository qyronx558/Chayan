export function parseFlexibleDate(value: string | undefined | null): Date | null {
  if (!value) return null
  const s = value.trim()
  if (!s) return null

  const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    let year = parseInt(y, 10)
    if (year < 100) year += 2000
    const date = new Date(year, parseInt(m, 10) - 1, parseInt(d, 10))
    if (!Number.isNaN(date.getTime())) return date
  }

  const monthMatch = s.match(/\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\.?\b/i)
  if (monthMatch) {
    const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
    const month = monthNames.findIndex((m) => m.startsWith(monthMatch[1].toLowerCase()))
    const yearMatch = s.match(/\b(20\d{2})\b/)
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()
    const dayMatch = s.match(/\b(\d{1,2})\b/)
    const day = dayMatch ? Math.min(31, Math.max(1, parseInt(dayMatch[1], 10))) : 1
    return new Date(year, month, day)
  }

  return null
}

export function monthRange(month: string): { start: Date; end: Date } {
  const [y, m] = month.split("-").map((v) => parseInt(v, 10))
  const start = new Date(Date.UTC(y, (m || 1) - 1, 1))
  const end = new Date(Date.UTC(y, m || 1, 1))
  return { start, end }
}

export function toMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map((v) => parseInt(v, 10))
  return new Date(Date.UTC(y, (m || 1) - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function parseMonthParts(month: string): { year: number; month: number } {
  const [y, m] = month.split("-").map((v) => parseInt(v, 10))
  return { year: Number.isFinite(y) ? y : new Date().getFullYear(), month: Number.isFinite(m) ? Math.min(12, Math.max(1, m)) : 1 }
}

/** Local-calendar day key `yyyy-mm-dd` for grouping ISO dates by viewer day. */
export function toDayKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/** Build a month matrix: rows of 7 cells, `null` for outside-month padding. */
export function getMonthMatrix(month: string): (number | null)[][] {
  const { year, month: m } = parseMonthParts(month)
  const firstWeekday = new Date(year, m - 1, 1).getDay()
  const daysInMonth = new Date(year, m, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function daysInMonthFor(month: string): number {
  const { year, month: m } = parseMonthParts(month)
  return new Date(year, m, 0).getDate()
}

/** "exam_date_foo" -> "Exam Date Foo" */
export function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
}