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