import { createHash } from "node:crypto"

/** Hex sha256 of a string. */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|ref$|source$)/i

/**
 * Canonical form of a notice URL so the same PDF is never ingested twice:
 * lower-case host, no fragment, no tracking params, sorted query, no trailing slash.
 * Returns null for anything that is not an http(s) URL.
 */
export function normalizeUrl(raw: string, base?: string): string | null {
  let u: URL
  try {
    u = new URL(raw.trim(), base)
  } catch {
    return null
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null
  u.hash = ""
  u.hostname = u.hostname.toLowerCase()
  const params = [...u.searchParams.entries()].filter(([k]) => !TRACKING_PARAMS.test(k)).sort(([a], [b]) => a.localeCompare(b))
  u.search = ""
  for (const [k, v] of params) u.searchParams.append(k, v)
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.replace(/\/+$/, "")
  return u.toString()
}

/** Dedupe key for a URL: http/https and www. are treated as the same document. */
export function urlHash(url: string): string {
  const n = normalizeUrl(url) ?? url
  return sha256(n.replace(/^https?:\/\/(www\.)?/i, ""))
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
  jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
}

function iso(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null // 31/02 etc.
  return dt.toISOString().slice(0, 10)
}

/**
 * Parses the date formats used on Indian government sites into YYYY-MM-DD.
 * Numeric dates are always day-first (dd/mm/yyyy), never US month-first.
 */
export function parseIndianDate(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.trim().replace(/(\d)(st|nd|rd|th)\b/gi, "$1")
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/)
  if (m) return iso(+m[1], +m[2], +m[3])
  m = s.match(/(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{2,4})/)
  if (m) return iso(+m[3], +m[2], +m[1])
  m = s.match(/(\d{1,2})[\s-]+([A-Za-z]{3,9})\.?,?[\s-]+(\d{4})/)
  if (m && MONTHS[m[2].toLowerCase()]) return iso(+m[3], MONTHS[m[2].toLowerCase()], +m[1])
  m = s.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/)
  if (m && MONTHS[m[1].toLowerCase()]) return iso(+m[3], MONTHS[m[1].toLowerCase()], +m[2])
  return null
}

/** Today's date in India (YYYY-MM-DD) - deadlines are IST calendar days. */
export function todayIST(now: Date = new Date()): string {
  return new Date(now.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10)
}

const STOP = new Set([
  "the", "of", "and", "for", "in", "to", "a", "an", "on", "at", "by", "with", "notice", "notification",
  "advertisement", "advt", "recruitment", "post", "posts", "vacancy", "vacancies", "online", "apply",
  "form", "regarding", "reg", "under", "office", "dated", "date", "no", "letter",
])

/** Lower-cased significant tokens of a title (used for near-duplicate checks). */
export function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOP.has(t)),
  )
}

/** Jaccard similarity of two token sets, 0..1. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 1
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  return inter / (a.size + b.size - inter)
}

/**
 * Same-notice fingerprint across sources: organisation + advertisement number
 * (or sorted title tokens) + last date. Two sites mirroring one notice collide.
 */
export function contentHash(p: { kind: string; department?: string | null; advertisementNo?: string | null; title: string; lastDate?: string | null }): string {
  const dept = (p.department ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")
  const advt = (p.advertisementNo ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")
  const core = advt || [...titleTokens(p.title)].sort().join(" ")
  return sha256([p.kind, dept, core, p.lastDate ?? ""].join("|"))
}

// Restricted Indian registries only - anyone can register .org.in / .in, so those need allowHosts.
const OFFICIAL_SUFFIXES = [".gov.in", ".nic.in", ".ac.in", ".edu.in", ".res.in"]

/** True when the URL points at a government / institutional host (or an allow-listed one). */
export function isOfficialUrl(url: string | null | undefined, allowHosts: string[] = []): boolean {
  if (!url) return false
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return false
  }
  if (allowHosts.some((h) => host === h || host.endsWith(`.${h}`))) return true
  return OFFICIAL_SUFFIXES.some((s) => host.endsWith(s)) || host === "gov.in" || host === "nic.in"
}

/** Collapses whitespace and strips control characters. */
export function cleanText(s: string | null | undefined): string {
  return (s ?? "").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim()
}

const DATE_LIKE = /\b\d{1,2}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{2,4}\b|\b\d{1,2}(?:st|nd|rd|th)?[\s-]+[A-Za-z]{3,9}\.?,?[\s-]+\d{4}\b/g

/**
 * Old archive entries must not be re-published as "new" (stale content is a
 * poor reader experience and a scaled-content signal). An item is stale when its
 * end date has passed, or when every date printed with it is older than maxAgeDays.
 */
export function isStaleListing(
  item: { title: string; description?: string; startDate?: string; endDate?: string },
  today: string,
  maxAgeDays = 45,
): boolean {
  const end = parseIndianDate(item.endDate)
  if (end) return end < today
  const found = [item.startDate ?? "", ...`${item.title} ${item.description ?? ""}`.match(DATE_LIKE) ?? []]
    .map((d) => parseIndianDate(d))
    .filter((d): d is string => Boolean(d))
  if (!found.length) return false
  const newest = found.sort().at(-1)!
  const cutoff = new Date(Date.parse(`${today}T00:00:00Z`) - maxAgeDays * 86400_000).toISOString().slice(0, 10)
  return newest < cutoff
}
