import { stripHtmlToText } from "@/lib/blog-prose"
import { formatDate } from "@/lib/utils"

/** Split plain or newline text into clean steps. Shared so parsing never invents data. */
export function stepify(text: string | null | undefined): string[] {
  if (!text) return []
  // Also split on common bullet / numbered prefixes when newlines are missing
  const normalized = text
    .replace(/\r/g, "\n")
    .replace(/[\u2022\u25CF\u27A2>]+/g, "\n")
    .replace(/(\d+)[.)]\s+/g, "\n$1. ")
  return normalized
    .split("\n")
    .map((s) => s.replace(/^\s*(?:\d+[.)]|[-*])\s*/, "").trim())
    .filter(Boolean)
}

export interface FeeBar {
  label: string
  amount: number
}

/**
 * Parse fee text into chartable bars. Returns [] when not parseable
 * so callers fall back to plain text (never fake numbers).
 * Example inputs: "General/OBC: Rs 100, SC/ST: Rs 50, PH: Nil"
 */
export function parseFeeBars(applicationFee: string | null | undefined): FeeBar[] {
  if (!applicationFee) return []
  const plain = stripHtmlToText(applicationFee)
  if (!plain || plain.length < 2) return []

  const chunks = plain
    .split(/[\n;|]+/)
    .flatMap((c) => c.split(/,(?![0-9]{3}\b)/)) // avoid splitting "1,000"
    .map((c) => c.trim())
    .filter((c) => c.length > 1)

  const labelFor = (chunk: string): string => {
    const c = chunk.toLowerCase()
    if (/general|unreserved|ur\b/.test(c)) return "General"
    if (/obc|ews/.test(c)) return "OBC / EWS"
    if (/sc\b/.test(c) && /st\b/.test(c)) return "SC / ST"
    if (/sc\b/.test(c)) return "SC"
    if (/st\b/.test(c)) return "ST"
    if (/ph|pwd|disabled|handicap/.test(c)) return "PH"
    if (/female|women/.test(c)) return "Women"
    if (/all|every/.test(c)) return "All"
    // Fallback: first 14 chars of chunk as label
    const short = chunk.replace(/₹|rs\.?|rupees?|fee|application|:|-/gi, "").trim().slice(0, 14)
    return short || "Fee"
  }

  const bars: FeeBar[] = []
  const seen = new Set<string>()
  for (const chunk of chunks) {
    // Match ₹1,000 / Rs 100 / INR 500 / "Nil" / "Free" / "No fee"
    const freeMatch = /(nil|free|no\s*fee|exempted|n\.a)/i.test(chunk)
    const m = chunk.match(/(?:₹|rs\.?|inr)?\s*([\d,]+)/i)
    if (!m && !freeMatch) continue
    const amount = freeMatch ? 0 : parseInt(m![1].replace(/,/g, ""), 10)
    if (!isFinite(amount) || amount > 100000) continue
    // A bare year ("Notification 2026") is not a fee - require a currency marker for year-like numbers.
    if (!freeMatch && amount >= 1990 && amount <= 2100 && !/(?:₹|rs\.?|inr|rupees?)\s*[\d,]+/i.test(chunk)) continue
    const label = labelFor(chunk)
    if (seen.has(label)) continue
    seen.add(label)
    bars.push({ label, amount })
    if (bars.length >= 5) break
  }

  // Single flat fee (e.g. "Rs 100 for all") is not a comparison - let caller show text.
  if (bars.length < 2) return []
  return bars
}

export function formatRupees(n: number): string {
  if (n === 0) return "Free"
  return `₹${n.toLocaleString("en-IN")}`
}

export interface SalaryRange {
  min: number
  max: number
}

/** Parse "Rs. 35400 - 112400" / "₹21700-69100" / "Level-6". Null when not parseable. */
export function parseSalaryRange(salary: string | null | undefined): SalaryRange | null {
  if (!salary) return null
  const plain = stripHtmlToText(salary)
  const nums = [...plain.matchAll(/([\d,]{4,})/g)]
    .map((m) => parseInt(m[1].replace(/,/g, ""), 10))
    .filter((n) => isFinite(n) && n >= 5000 && n <= 5000000)
  if (nums.length >= 2) {
    const min = Math.min(...nums)
    const max = Math.max(...nums)
    if (max > min) return { min, max }
  }
  return null
}

export interface VacancyScale {
  label: string
  hint: string
  percent: number
}

/** Visual scale indicator from total vacancies only - labelled as scale, not competition data. */
export function vacancyScale(total: number | null | undefined): VacancyScale | null {
  if (!total || total <= 0) return null
  const percent = Math.min(100, Math.round(18 + 20 * Math.log10(total + 1)))
  if (total >= 1000) return { label: "Mega drive", hint: "Large intake - wide opportunity", percent }
  if (total >= 200) return { label: "Large", hint: "Good number of posts", percent }
  if (total >= 50) return { label: "Medium", hint: "Moderate intake", percent }
  return { label: "Limited", hint: "Few posts - apply early", percent }
}

/** % of application window elapsed. Null when dates missing/invalid. */
export function windowProgress(
  startDate: string | null | undefined,
  lastDate: string | null | undefined,
  nowMs = Date.now(),
): number | null {
  if (!startDate || !lastDate) return null
  const s = new Date(startDate).getTime()
  const e = new Date(lastDate).getTime()
  if (!isFinite(s) || !isFinite(e) || e <= s) return null
  if (nowMs <= s) return 0
  if (nowMs >= e) return 100
  return Math.round(((nowMs - s) / (e - s)) * 100)
}

export interface TimelineStage {
  key: string
  label: string
  date: string
  done: boolean
  isLast?: boolean
}

/** Build a genuine timeline only from stored dates - no invented exam/result dates. */
export function buildTimeline(
  importantDates: Record<string, string> | null | undefined,
  startDate: string | null | undefined,
  lastDate: string | null | undefined,
  nowMs = Date.now(),
): TimelineStage[] {
  const stages: TimelineStage[] = []
  const push = (key: string, label: string, date: string | null | undefined, isLast = false) => {
    if (!date) return
    const t = new Date(date).getTime()
    if (!isFinite(t)) return
    stages.push({ key, label, date, done: t < nowMs, isLast })
  }

  // Prefer explicit importantDates entries when present (they are the source of truth)
  if (importantDates && Object.keys(importantDates).length > 0) {
    const entries = Object.entries(importantDates).slice(0, 6)
    for (const [label, date] of entries) {
      if (!date) continue
      const t = new Date(date).getTime()
      if (!isFinite(t)) continue
      stages.push({
        key: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        label,
        date,
        done: t < nowMs,
      })
    }
    if (stages.length > 0) {
      stages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      stages[stages.length - 1].isLast = true
      return stages.slice(0, 6)
    }
  }

  push("start", "Applications open", startDate)
  push("last", "Last date to apply", lastDate, true)
  return stages
}

export interface SelectionStep {
  label: string
  icon: "exam" | "physical" | "interview" | "document" | "medical" | "final" | "other"
}

/** Infer step icons by keyword - labels always come from the stored text. */
export function inferSelectionSteps(selectionProcess: string | null | undefined): SelectionStep[] {
  const steps = stepify(selectionProcess)
  if (steps.length === 0) return []
  const iconFor = (s: string): SelectionStep["icon"] => {
    const c = s.toLowerCase()
    if (/physical|pet|pst|running|endurance/.test(c)) return "physical"
    if (/interview|personality|viva/.test(c)) return "interview"
    if (/document|verification|dv\b/.test(c)) return "document"
    if (/medical|fitness/.test(c)) return "medical"
    if (/merit|final|result|allotment/.test(c)) return "final"
    if (/exam|written|cbt|cbe|prelims|mains|test|computer|skill|typing|trade/.test(c)) return "exam"
    return "other"
  }
  return steps.slice(0, 8).map((label) => ({ label, icon: iconFor(label) }))
}

/** Shortest fee text for KPI chips, e.g. "₹100 onwards" / "Free for SC/ST". Never invents. */
export function feeKpi(applicationFee: string | null | undefined): string | null {
  const bars = parseFeeBars(applicationFee)
  if (bars.length >= 2) {
    const min = Math.min(...bars.map((b) => b.amount))
    const max = Math.max(...bars.map((b) => b.amount))
    if (min === 0) return `Free onwards (up to ${formatRupees(max)})`
    if (min === max) return formatRupees(min)
    return `${formatRupees(min)} – ${formatRupees(max)}`
  }
  if (!applicationFee) return null
  const plain = stripHtmlToText(applicationFee).replace(/\s+/g, " ").trim()
  if (!plain) return null
  return plain.length > 42 ? `${plain.slice(0, 42).trim()}…` : plain
}

/**
 * Plain-text value when it is short enough to live in a "key fact" tile, else null.
 * Decides where a field is shown: tile (short) vs full section (long) - never both.
 */
export function shortFact(value: string | null | undefined, max = 32): string | null {
  if (!value) return null
  const t = stripHtmlToText(value).replace(/\s+/g, " ").trim()
  if (!t || t.length > max) return null
  return t
}

export type DeadlineState = "none" | "upcoming" | "open" | "urgent" | "closed"

export interface Deadline {
  state: DeadlineState
  daysLeft: number | null
  /** Short human label, e.g. "12 days left", "Closes today", "Opens 12 Dec 2026". */
  label: string
  /** % of application window elapsed (null when start/last date missing). */
  progress: number | null
}

/** Single source of truth for application-window state, shared by hero, rail and mobile bar. */
export function getDeadline(
  startDate: string | null | undefined,
  lastDate: string | null | undefined,
  status: string | null | undefined,
  nowMs = Date.now(),
): Deadline {
  const last = lastDate ? new Date(lastDate).getTime() : NaN
  const start = startDate ? new Date(startDate).getTime() : NaN
  const hasLast = isFinite(last)
  const progress = windowProgress(startDate, lastDate, nowMs)

  if (status === "EXPIRED" || (hasLast && last <= nowMs)) {
    return { state: "closed", daysLeft: null, label: "Applications closed", progress }
  }
  if ((isFinite(start) && start > nowMs) || (status === "UPCOMING" && !(isFinite(start) && start <= nowMs))) {
    return {
      state: "upcoming",
      daysLeft: null,
      label: isFinite(start) ? `Opens ${formatDate(startDate)}` : "Opening soon",
      progress,
    }
  }
  if (!hasLast) return { state: "none", daysLeft: null, label: "Applications open", progress }

  const daysLeft = Math.ceil((last - nowMs) / 86400000)
  const label = daysLeft <= 1 ? "Closes today" : `${daysLeft} days left`
  return { state: daysLeft <= 7 ? "urgent" : "open", daysLeft, label, progress }
}

export interface DateRow {
  label: string
  /** Formatted date when parseable, otherwise the raw stored text (never dropped). */
  value: string
  ms: number | null
  /** Closing-type date - highlighted. */
  key: boolean
}

/** Rows for the dates section: stored importantDates, plus start/last date if not already listed. */
export function buildDateRows(
  importantDates: Record<string, string> | null | undefined,
  startDate: string | null | undefined,
  lastDate: string | null | undefined,
): DateRow[] {
  const rows: DateRow[] = []
  const add = (label: string, raw: string | null | undefined) => {
    if (!raw || typeof raw !== "string" || !raw.trim()) return
    const t = new Date(raw).getTime()
    const ok = isFinite(t)
    rows.push({ label, value: ok ? formatDate(raw) : raw.trim(), ms: ok ? t : null, key: /last|clos|end/i.test(label) })
  }
  if (importantDates && typeof importantDates === "object") {
    for (const [label, raw] of Object.entries(importantDates)) add(label, raw)
  }
  if (!rows.some((r) => /start|begin|open/i.test(r.label))) add("Applications open", startDate)
  if (!rows.some((r) => /last|clos|end/i.test(r.label))) add("Last date to apply", lastDate)
  return rows.sort((a, b) => (a.ms ?? Infinity) - (b.ms ?? Infinity))
}
