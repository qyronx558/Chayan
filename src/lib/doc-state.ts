import { getDeadline } from "@/lib/job-insights"
import { formatDate } from "@/lib/utils"

export type DocKind = "result" | "admit-card" | "answer-key" | "syllabus" | "admission"
export type PrimaryDateMode = "countdown" | "since" | "date"

export interface DocState {
  /** Pill text: "Out", "Awaiting release", "Exam in 12 days", "Closing soon"... */
  pill: string
  /** Headline for the rail. */
  headline: string
  /** One supporting line, e.g. "Declared 3 days ago · 12 Nov 2026". */
  sub: string | null
  tone: "hot" | "ok" | "muted"
  /** 0-100 application-window progress (admissions only). */
  progress: number | null
}

const DAY = 86400000

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`

/** Whole days from now to date (negative = past), calendar-day based. */
function dayDelta(iso: string, nowMs: number): number {
  const d = new Date(iso)
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  const n = new Date(nowMs)
  const b = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())
  return Math.round((a - b) / DAY)
}

/** Single source of truth for "what is the state of this document right now". Only stored data is used. */
export function getDocState(p: {
  kind: DocKind
  hasFile: boolean
  /** Published record with real content (e.g. syllabus topics) even when no PDF is attached. */
  hasContent?: boolean
  primaryDate: string | null
  primaryDateMode: PrimaryDateMode
  windowStart: string | null
  nowMs: number
}): DocState {
  const { kind, hasFile, hasContent = hasFile, primaryDate, primaryDateMode, windowStart, nowMs } = p

  // Admission: real application window
  if (kind === "admission" && primaryDate) {
    const d = getDeadline(windowStart, primaryDate, null, nowMs)
    return {
      pill: d.state === "urgent" ? "Closing soon" : d.state === "closed" ? "Closed" : d.state === "upcoming" ? "Upcoming" : "Open",
      headline: d.label,
      sub: d.state === "closed" ? `Closed ${formatDate(primaryDate)}` : `Last date ${formatDate(primaryDate)}`,
      tone: d.state === "urgent" ? "hot" : d.state === "closed" ? "muted" : "ok",
      progress: d.state === "open" || d.state === "urgent" ? d.progress : null,
    }
  }

  // Dated events: exam (admit card)
  if (primaryDateMode === "countdown" && primaryDate) {
    const delta = dayDelta(primaryDate, nowMs)
    const when = formatDate(primaryDate)
    if (delta > 0) {
      return {
        pill: delta <= 7 ? "Exam soon" : hasFile ? "Out" : "Awaiting release",
        headline: delta === 1 ? "Exam tomorrow" : `Exam in ${plural(delta, "day")}`,
        sub: `${when}${hasFile ? "" : " · admit card not released yet"}`,
        tone: delta <= 7 ? "hot" : "ok",
        progress: null,
      }
    }
    return {
      pill: delta === 0 ? "Exam today" : "Exam held",
      headline: delta === 0 ? "Exam today" : "Exam held",
      sub: when,
      tone: delta === 0 ? "hot" : "muted",
      progress: null,
    }
  }

  // Declared / published documents (result, answer key, syllabus)
  const noun = kind === "result" ? "Result" : kind === "admit-card" ? "Admit card" : kind === "answer-key" ? "Answer key" : "Syllabus"
  let sub: string | null = null
  if (primaryDate && primaryDateMode === "since") {
    const delta = dayDelta(primaryDate, nowMs)
    sub =
      delta === 0 ? `Declared today · ${formatDate(primaryDate)}`
      : delta < 0 ? `Declared ${plural(-delta, "day")} ago · ${formatDate(primaryDate)}`
      : `Expected ${formatDate(primaryDate)}`
  }
  return hasContent
    ? { pill: "Out", headline: `${noun} is out`, sub, tone: "ok", progress: null }
    : { pill: "Awaiting release", headline: "Awaiting official release", sub: sub ?? "We'll show the file here as soon as it is published.", tone: "muted", progress: null }
}
