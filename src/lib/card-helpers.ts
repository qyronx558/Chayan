/**
 * Card content hygiene: title cleaning, org aliases, dummy filtering.
 * Used by homepage sections AND listing clients so both stay consistent.
 */

const ORG_ALIASES: Record<string, string> = {
  "institute of banking personnel selection": "IBPS",
  "union public service commission": "UPSC",
  "staff selection commission": "SSC",
  "railway recruitment board": "RRB",
  "national testing agency": "NTA",
  "bihar school examination board": "BSEB",
  "uttar pradesh public service commission": "UPPSC",
  "uttar pradesh subordinate services selection commission": "UPSSSC",
  "madhya pradesh public service commission": "MPPSC",
  "rajasthan public service commission": "RPSC",
  "bihar public service commission": "BPSC",
  "jharkhand public service commission": "JPSC",
  "indian post office": "India Post",
  "indian railways": "Railways",
}

export function getOrgAlias(name: string | null | undefined): string {
  if (!name) return ""
  const trimmed = name.trim().replace(/\s+/g, " ")
  const hit = ORG_ALIASES[trimmed.toLowerCase()]
  if (hit) return hit
  return trimmed
}

/** Remove "| Chayanjobs" / "| ChayanJobs" (both spellings, any case) + collapse whitespace. */
export function cleanTitle(title: string | null | undefined): string {
  if (!title) return ""
  return title
    .replace(/\s*[|–—-]\s*chayanjobs(\s+blog)?\s*$/i, "")
    .replace(/\s*[|–—-]\s*chayan\s*jobs(\s+blog)?\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
}

const DUMMY_PATTERNS = [
  "dfsdfsdf",
  "dggff",
  "asdf",
  "lorem",
  "dummy",
  "sample",
]

/**
 * True when a title is a dummy/test record that must never render.
 * - exact short junk (test, asdf, xxx, abc, qwerty)
 * - contains junk tokens above
 * - very short (<3 chars) or empty after cleaning
 */
export function isDummyTitle(title: string | null | undefined): boolean {
  if (!title) return true
  const cleaned = cleanTitle(title).toLowerCase().trim()
  if (!cleaned || cleaned.length < 3) return true
  if (["test", "testing", "asdf", "xxx", "abc", "qwerty", "demo"].includes(cleaned)) return true
  return DUMMY_PATTERNS.some((p) => cleaned.includes(p))
}

export function isDummyItem(item: { title?: unknown }): boolean {
  return isDummyTitle(typeof item.title === "string" ? item.title : "")
}

/** Filter any array of {title} items for homepage + listing rendering. */
export function filterValidItems<T extends { title?: unknown }>(items: T[] | null | undefined): T[] {
  if (!items) return []
  return items.filter((it) => !isDummyItem(it))
}
