import type { LlmExtraction } from "./schema"
import type { ListingLink } from "./types"
import { normalizeUrl } from "./normalize"

/**
 * Accuracy guard: every value the LLM returns must be traceable to the
 * official notice. Anything that cannot be found in the source text is
 * dropped (set to null) rather than published - a missing field is
 * acceptable, a wrong date or vacancy count is not.
 */

const DEVANAGARI_DIGITS = /[०-९]/g
const asciiDigits = (s: string) => s.replace(DEVANAGARI_DIGITS, (d) => String(d.charCodeAt(0) - 0x0966))

/** Lower-case, ASCII digits, punctuation collapsed - used for substring checks. */
export function normForMatch(s: string): string {
  return asciiDigits(s)
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[‘’“”"'`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

const MONTH_NAMES = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

/** All common spellings of an ISO date as they appear in Indian notices (normalised). */
export function dateVariants(isoDate: string): string[] {
  const [y, m, d] = isoDate.split("-").map(Number)
  const dd = String(d).padStart(2, "0")
  const mm = String(m).padStart(2, "0")
  const yy = String(y).slice(2)
  const mon = MONTH_NAMES[m - 1]
  const short = mon.slice(0, 3)
  const raw = [
    `${dd}/${mm}/${y}`, `${d}/${m}/${y}`, `${dd}-${mm}-${y}`, `${d}-${m}-${y}`, `${dd}.${mm}.${y}`, `${d}.${m}.${y}`,
    `${dd}/${mm}/${yy}`, `${dd}-${mm}-${yy}`, `${dd}.${mm}.${yy}`,
    `${d} ${mon} ${y}`, `${dd} ${mon} ${y}`, `${d} ${short} ${y}`, `${dd} ${short} ${y}`,
    `${mon} ${d} ${y}`, `${short} ${d} ${y}`, `${d}th ${mon} ${y}`, `${d}st ${mon} ${y}`, `${d}nd ${mon} ${y}`, `${d}rd ${mon} ${y}`,
    `${y}-${mm}-${dd}`,
  ]
  return [...new Set(raw.map(normForMatch))]
}

function containsPhrase(haystack: string, needle: string): boolean {
  if (!needle) return false
  return ` ${haystack} `.includes(` ${needle} `)
}

/** Share of the evidence's tokens found, in order-insensitive form, inside the source. */
function tokenCoverage(source: string, evidence: string): number {
  const toks = evidence.split(" ").filter((t) => t.length > 1)
  if (!toks.length) return 0
  const set = new Set(source.split(" "))
  return toks.filter((t) => set.has(t)).length / toks.length
}

export interface GroundingResult {
  extraction: LlmExtraction
  dropped: string[]
  /** Fraction of non-null factual fields that were verified (0..1). */
  verifiedRatio: number
}

const TEXT_FIELDS = [
  "salary", "ageLimit", "ageRelaxation", "education", "experience", "selectionProcess",
  "applicationFee", "documentsRequired", "howToApply",
] as const
const DATE_FIELDS = ["startDate", "lastDate", "examDate", "resultDate"] as const

/**
 * Verifies an extraction against the notice text and the links found on the
 * listing/detail page. `sourceText` empty ⇒ nothing can be verified, so every
 * factual field is kept but the caller must treat the post as unverified.
 */
export function groundExtraction(ex: LlmExtraction, sourceText: string, links: ListingLink[]): GroundingResult {
  const out: LlmExtraction = { ...ex, evidence: { ...ex.evidence } }
  const dropped: string[] = []
  const src = normForMatch(sourceText)
  if (!src) return { extraction: out, dropped, verifiedRatio: 0 }

  let checked = 0
  let verified = 0
  const drop = (field: string) => {
    dropped.push(field)
    ;(out as Record<string, unknown>)[field] = null
  }

  // Numbers: the exact figure (with or without Indian digit grouping) must be printed.
  if (out.totalVacancies !== null) {
    checked++
    const n = out.totalVacancies
    const variants = [String(n), n.toLocaleString("en-IN"), n.toLocaleString("en-US")].map(normForMatch)
    if (variants.some((v) => containsPhrase(src, v))) verified++
    else drop("totalVacancies")
  }

  // Dates: some spelling of the same calendar day must be printed.
  for (const f of DATE_FIELDS) {
    const v = out[f]
    if (!v) continue
    checked++
    if (dateVariants(v).some((variant) => containsPhrase(src, variant))) verified++
    else drop(f)
  }

  if (out.advertisementNo) {
    checked++
    const advt = normForMatch(out.advertisementNo).replace(/^(advt|advertisement)\s*(no)?\s*/, "")
    if (advt && src.replace(/\s/g, "").includes(advt.replace(/\s/g, ""))) verified++
    else drop("advertisementNo")
  }

  // Free-text fields: the quoted evidence (or the value itself) must be in the notice.
  for (const f of TEXT_FIELDS) {
    const v = out[f]
    if (!v) continue
    checked++
    const ev = normForMatch(out.evidence[f] ?? "")
    const val = normForMatch(v)
    const ok = (ev.length >= 4 && (containsPhrase(src, ev) || tokenCoverage(src, ev) >= 0.85)) || tokenCoverage(src, val) >= 0.8
    if (ok) verified++
    else drop(f)
  }

  // Links: only URLs that literally appear on the page or in the notice survive.
  const known = new Set(links.map((l) => normalizeUrl(l.url)).filter(Boolean) as string[])
  for (const f of ["applyLink", "officialWebsite"] as const) {
    const v = out[f]
    if (!v) continue
    checked++
    const n = normalizeUrl(v)
    const host = (() => {
      try {
        return new URL(v).hostname.replace(/^www\./, "")
      } catch {
        return ""
      }
    })()
    if ((n && known.has(n)) || (host && src.includes(normForMatch(host)))) verified++
    else drop(f)
  }

  // importantDates rows: keep only rows whose date is printed in the notice.
  if (out.importantDates?.length) {
    const kept = out.importantDates.filter((r) => {
      const d = normForMatch(r.date)
      return d.length >= 4 && (containsPhrase(src, d) || tokenCoverage(src, d) === 1)
    })
    if (kept.length !== out.importantDates.length) dropped.push("importantDates")
    out.importantDates = kept.length ? kept : null
  }

  return { extraction: out, dropped, verifiedRatio: checked ? verified / checked : 0 }
}
