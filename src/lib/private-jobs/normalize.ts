import { createHash } from "crypto"
import { SKILLS } from "@/lib/skills"

/**
 * Deterministic (no-LLM) normalisation for private-job postings coming from
 * structured sources (ATS feeds). Every function here is pure so it can be
 * unit-tested and run thousands of times per sync without cost.
 */

export { decodeEntities, htmlToText } from "@/lib/private-jobs/html-text"
import { decodeEntities } from "@/lib/private-jobs/html-text"

/* ───────────────────────── location ───────────────────────── */

const INDIA_PLACES = [
  "india", "bengaluru", "bangalore", "mumbai", "navi mumbai", "thane", "delhi", "new delhi", "ncr", "noida", "greater noida",
  "gurgaon", "gurugram", "faridabad", "ghaziabad", "hyderabad", "secunderabad", "chennai", "kolkata", "pune", "ahmedabad",
  "gandhinagar", "surat", "vadodara", "jaipur", "lucknow", "kanpur", "indore", "bhopal", "nagpur", "nashik", "coimbatore",
  "kochi", "cochin", "trivandrum", "thiruvananthapuram", "mysore", "mysuru", "mangalore", "mangaluru", "chandigarh", "mohali",
  "ludhiana", "dehradun", "patna", "ranchi", "bhubaneswar", "visakhapatnam", "vizag", "vijayawada", "guwahati", "goa",
  "madurai", "tiruchirappalli", "trichy", "raipur", "jodhpur", "udaipur", "agra", "varanasi", "prayagraj", "srinagar",
  "jammu", "shimla", "hubli", "belgaum", "aurangabad", "rajkot", "karnataka", "maharashtra", "tamil nadu", "telangana",
  "kerala", "gujarat", "rajasthan", "uttar pradesh", "west bengal", "haryana", "punjab", "andhra pradesh", "odisha",
  "madhya pradesh", "bihar", "assam", "jharkhand", "uttarakhand", "chhattisgarh",
]

const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru", "bengaluru": "Bengaluru", gurgaon: "Gurugram", gurugram: "Gurugram", bombay: "Mumbai",
  "new delhi": "Delhi", delhi: "Delhi", cochin: "Kochi", trivandrum: "Thiruvananthapuram", mysore: "Mysuru",
  mangalore: "Mangaluru", vizag: "Visakhapatnam", calcutta: "Kolkata", madras: "Chennai", poona: "Pune",
}

const placeRe = new RegExp(`\\b(${INDIA_PLACES.map((p) => p.replace(/ /g, "\\s+")).join("|")})\\b`, "i")
const REMOTE_RE = /\b(remote|work from home|wfh|anywhere|distributed)\b/i
const HYBRID_RE = /\bhybrid\b/i

export function isIndiaLocation(location: string | null | undefined): boolean {
  return !!location && placeRe.test(location)
}

export function isRemoteText(text: string | null | undefined): boolean {
  return !!text && REMOTE_RE.test(text)
}

/** "Bangalore, Karnataka, India" → "Bengaluru, Karnataka, India" (canonical city names). */
export function normalizeLocation(location: string | null | undefined): string | null {
  if (!location) return null
  const cleaned = decodeEntities(location).replace(/\s+/g, " ").trim()
  if (!cleaned) return null
  return cleaned
    .split(/\s*[,/;|]\s*/)
    .filter(Boolean)
    .map((part) => CITY_ALIASES[part.toLowerCase()] ?? part)
    .filter((part, i, all) => all.findIndex((p) => p.toLowerCase() === part.toLowerCase()) === i)
    .join(", ")
    .slice(0, 190)
}

/** First canonical city in a location string (for dedupe keys). */
export function primaryCity(location: string | null | undefined): string {
  const norm = normalizeLocation(location)
  if (!norm) return ""
  return norm.split(", ")[0].toLowerCase()
}

export type RemotePolicyValue = "ONSITE" | "HYBRID" | "REMOTE"

export function detectRemotePolicy(
  explicit: string | null | undefined,
  location: string | null | undefined,
  title: string
): RemotePolicyValue {
  const hint = (explicit || "").toLowerCase()
  if (hint === "remote") return "REMOTE"
  if (hint === "hybrid") return "HYBRID"
  if (hint === "on-site" || hint === "onsite") return "ONSITE"
  const text = `${location || ""} ${title}`
  if (HYBRID_RE.test(text)) return "HYBRID"
  if (REMOTE_RE.test(text)) return "REMOTE"
  return "ONSITE"
}

/* ───────────────────────── job type / experience ───────────────────────── */

export type JobTypeValue = "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "CONTRACT"

export function detectJobType(commitment: string | null | undefined, title: string): JobTypeValue {
  const text = `${commitment || ""} ${title}`.toLowerCase()
  if (/\bintern(ship)?\b|\btrainee\b|\bapprentice/.test(text)) return "INTERNSHIP"
  if (/\bpart[\s-]?time\b/.test(text)) return "PART_TIME"
  if (/\bcontract(or|ual)?\b|\bfreelanc|\btemporary\b|\bfixed[\s-]term\b/.test(text)) return "CONTRACT"
  return "FULL_TIME"
}

const SENIOR_TITLE = /\b(senior|sr\.?|lead|principal|staff|head|director|vp|vice president|architect|manager)\b/i
const FRESHER_TITLE = /\b(fresher|graduate|entry[\s-]level|junior|jr\.?|trainee|intern|associate i\b|new grad)/i

/** Years of experience from free text: "3-5 years", "2+ yrs", "minimum 4 years", "fresher". */
export function parseExperience(text: string | null | undefined): { min: number | null; max: number | null } {
  if (!text) return { min: null, max: null }
  const t = text.toLowerCase()
  const range = t.match(/(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)/)
  if (range) {
    const a = parseInt(range[1], 10)
    const b = parseInt(range[2], 10)
    if (a <= b && b <= 40) return { min: a, max: b }
  }
  const plus = t.match(/(\d{1,2})\s*\+\s*(?:years?|yrs?)|(?:minimum|min\.?|at least|over)\s*(?:of\s*)?(\d{1,2})\s*(?:years?|yrs?)|(\d{1,2})\s*(?:years?|yrs?)\s*(?:of\s*)?(?:\w+\s){0,3}experience/)
  if (plus) {
    const n = parseInt(plus[1] ?? plus[2] ?? plus[3], 10)
    if (n <= 40) return { min: n, max: null }
  }
  if (/\bfreshers?\b|\bno experience\b|\b0\s*(?:-|to)\s*1\s*(?:years?|yrs?)/.test(t)) return { min: 0, max: 1 }
  return { min: null, max: null }
}

export function experienceLabel(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min === 0 && (max ?? 0) <= 1) return "Fresher (0-1 yrs)"
  if (min != null && max != null) return `${min}-${max} yrs`
  if (min != null) return `${min}+ yrs`
  return `Up to ${max} yrs`
}

export function isFresherFriendly(title: string, exp: { min: number | null; max: number | null }): boolean {
  if (SENIOR_TITLE.test(title)) return false
  if (FRESHER_TITLE.test(title)) return true
  return exp.min === 0 && (exp.max == null || exp.max <= 2)
}

/* ───────────────────────── salary ───────────────────────── */

const LAKH = 100_000
const CRORE = 10_000_000
const SALARY_UNIT = "(k|lpa|lakhs?|lacs?|l|crores?|cr)"
const SALARY_NUM = "(\\d+(?:\\.\\d+)?)"
const SALARY_RANGE_RE = new RegExp(
  `${SALARY_NUM}\\s*${SALARY_UNIT}?\\b\\s*(?:-|–|to)\\s*(?:₹|rs\\.?|inr)?\\s*${SALARY_NUM}\\s*${SALARY_UNIT}?\\b`,
  "g"
)
const SALARY_SINGLE_RE = new RegExp(`${SALARY_NUM}\\s*${SALARY_UNIT}?\\b`, "g")
/** Words that, just before a bare number, mark it as money ("CTC 600000", "₹ 25000"). */
const MONEY_LEAD = /(₹|\brs\.?|\binr|\bctc|\bsalary|\bstipend|\bpay|\bpackage|\bcompensation)[^\d\n]{0,15}$/

/**
 * Annual INR salary range from free text. Returns nulls when the text is not
 * clearly INR (e.g. USD postings) - a wrong number is worse than none.
 */
export function parseSalaryINR(text: string | null | undefined): { min: number | null; max: number | null } {
  const none = { min: null, max: null }
  if (!text) return none
  const t = text.replace(/,/g, "").toLowerCase()
  if (/\$|usd|eur|€|£|gbp|aud|sgd/.test(t)) return none
  // INR marker, or an Indian money word (other currencies were rejected just above).
  const inr = /₹|\binr\b|\brs\.?|\brupees?\b|\blpa\b|\blakhs?\b|\blacs?\b|\bcrores?\b|\bcr\b|\bctc\b|\bstipend\b/.test(t)
  if (!inr) return none

  const scale = (u: string | undefined) => (!u ? 1 : u === "k" ? 1000 : u.startsWith("cr") ? CRORE : LAKH)
  // The first number(s) that are money: they carry a unit (LPA, lakh, k, cr) or follow a money
  // word. This skips "2-4 years" or "5 days a week" written before the salary.
  const isMoney = (m: RegExpMatchArray, unit: string | undefined) =>
    !!unit || MONEY_LEAD.test(t.slice(Math.max(0, (m.index ?? 0) - 25), m.index))
  const range = [...t.matchAll(SALARY_RANGE_RE)].find((m) => isMoney(m, m[2] ?? m[4]))
  const single = range ? undefined : [...t.matchAll(SALARY_SINGLE_RE)].find((m) => isMoney(m, m[2]))
  let a: number
  let b: number | null = null
  if (range) {
    // "6-9 LPA": a unit written only after the second number applies to both.
    const unitB = range[4] ?? range[2]
    a = parseFloat(range[1]) * scale(range[2] ?? unitB)
    b = parseFloat(range[3]) * scale(unitB)
  } else if (single) {
    a = parseFloat(single[1]) * scale(single[2])
  } else {
    return none
  }

  const monthly = /per\s*month|\/\s*month|\bmonthly\b|\bpm\b|p\.m\./.test(t)
  if (monthly) {
    a *= 12
    if (b != null) b *= 12
  }
  const sane = (n: number | null) => n != null && n >= 50_000 && n <= 50 * CRORE
  if (!sane(a)) return none
  if (b != null && (!sane(b) || b < a)) b = null
  return { min: Math.round(a), max: b != null ? Math.round(b) : null }
}

/** Structured salary (e.g. Lever's salaryRange) → annual INR, or nulls for other currencies. */
export function structuredSalaryINR(range: {
  min?: number | null
  max?: number | null
  currency?: string | null
  interval?: string | null
} | null | undefined): { min: number | null; max: number | null } {
  if (!range || (range.currency || "").toUpperCase() !== "INR") return { min: null, max: null }
  const interval = (range.interval || "").toLowerCase()
  const factor = interval.includes("month") ? 12 : interval.includes("hour") ? 0 : 1
  if (!factor) return { min: null, max: null }
  const conv = (n?: number | null) => (typeof n === "number" && n > 0 ? Math.round(n * factor) : null)
  return { min: conv(range.min), max: conv(range.max) }
}

export function salaryLabel(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  const fmt = (n: number) => `${+(n / LAKH).toFixed(1)}`
  if (min != null && max != null) return `₹${fmt(min)}-${fmt(max)} LPA`
  if (min != null) return `₹${fmt(min)}+ LPA`
  return `Up to ₹${fmt(max as number)} LPA`
}

/* ───────────────────────── skills ───────────────────────── */

// Too ambiguous to match in prose ("C", "R", "Go"), or not skills (education / seniority words).
const SKILL_STOP = new Set(["C", "R", "Go", "Shell", "Security", "Driving", "Administration"])
const SKILL_LIST = SKILLS.slice(0, SKILLS.indexOf("B.Tech") > 0 ? SKILLS.indexOf("B.Tech") : SKILLS.length).filter(
  (s) => !SKILL_STOP.has(s)
)
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const SKILL_MATCHERS = SKILL_LIST.map((skill) => ({
  skill,
  re: new RegExp(`(?<![A-Za-z0-9+#.])${escapeRe(skill)}(?![A-Za-z0-9+#])`, skill.length <= 3 ? "" : "i"),
}))

/** Skills mentioned in the posting, by word-boundary match against the canonical skill list. */
export function extractPostingSkills(title: string, text: string, limit = 12): string[] {
  const titleHits: string[] = []
  const bodyHits: string[] = []
  for (const { skill, re } of SKILL_MATCHERS) {
    if (re.test(title)) titleHits.push(skill)
    else if (re.test(text)) bodyHits.push(skill)
  }
  return [...titleHits, ...bodyHits].slice(0, limit)
}

/* ───────────────────────── hashes ───────────────────────── */

const sha = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 32)

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/\b(sr|snr)\b\.?/g, "senior")
    .replace(/\b(jr)\b\.?/g, "junior")
    .replace(/[^a-z0-9+#]+/g, " ")
    .trim()
}

/** Same company + same role + same city across sources = the same opening. */
export function dedupeHash(companyName: string, title: string, location: string | null | undefined): string {
  return sha(`${companyName.trim().toLowerCase()}|${normalizeTitle(title)}|${primaryCity(location)}`)
}

/** Stable fingerprint of the fields a sync writes; an unchanged hash means no DB write. */
export function contentHashOf(fields: Record<string, unknown>): string {
  const keys = Object.keys(fields).sort()
  return sha(JSON.stringify(keys.map((k) => [k, fields[k]])))
}
