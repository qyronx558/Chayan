import { countryName } from "@/lib/private-jobs/geo"

/** Display helpers shared by the private-jobs list row and preview panel. */

export interface ListJob {
  id: string
  title: string
  slug: string
  type: string
  category?: string | null
  description?: string | null
  location?: string | null
  /** ISO code (or custom name) and canonical city, when known. */
  country?: string | null
  city?: string | null
  salary?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  experience?: string | null
  applicationUrl?: string | null
  applicationEmail?: string | null
  lastDate?: string | null
  status: string
  remotePolicy?: string | null
  isFresherFriendly?: boolean
  isWalkIn?: boolean
  skills?: string[]
  trustScore?: number
  vacancies?: number | null
  source?: string | null
  proofUrl?: string | null
  createdAt: string
  company: { id: string; name: string; logo?: string | null; verifiedStatus?: string; website?: string | null; slug?: string }
}

export const JOB_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
}

export const WORK_MODE_LABEL: Record<string, string> = { REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site" }

/** "Bengaluru, Karnataka, India" → "Bengaluru"; several cities → "Bengaluru +2". */
export function shortLocation(location?: string | null): string | null {
  if (!location) return null
  const parts = location.split(/\s*[,/]\s*/).filter(Boolean)
  const cities = parts.filter((p) => !/^(india|karnataka|maharashtra|tamil nadu|telangana|haryana|uttar pradesh|delhi ncr|in)$/i.test(p))
  if (!cities.length) return parts[0] ?? null
  return cities.length > 1 ? `${cities[0]} +${cities.length - 1}` : cities[0]
}

/**
 * Place of a job for lists: "Bengaluru" for India, "Berlin, Germany" abroad,
 * "+2" when the posting lists more locations. Falls back to the location text.
 */
export function jobPlace(job: Pick<ListJob, "location" | "country" | "city">, opts: { full?: boolean } = {}): string | null {
  if (!job.city && !job.country) return opts.full ? job.location?.trim() || null : shortLocation(job.location)
  const country = countryName(job.country)
  const showCountry = opts.full || (job.country && job.country !== "IN")
  const base = job.city ? (showCountry && country && country !== job.city ? `${job.city}, ${country}` : job.city) : country
  if (opts.full) return base || null
  const extra = (job.location || "").split(/\s*(?:;|\|)\s*/).filter(Boolean).length - 1
  return extra > 0 ? `${base} +${extra}` : base || null
}

export function salaryText(job: Pick<ListJob, "salary" | "salaryMin" | "salaryMax">): string | null {
  const lpa = (n: number) => `${+(n / 100_000).toFixed(1)}`
  if (job.salaryMin && job.salaryMax) return `₹${lpa(job.salaryMin)}-${lpa(job.salaryMax)} LPA`
  if (job.salaryMin) return `₹${lpa(job.salaryMin)}+ LPA`
  if (job.salaryMax) return `Up to ₹${lpa(job.salaryMax)} LPA`
  return job.salary?.trim() || null
}

export function trustLabel(score?: number | null): { label: string; tone: "good" | "ok" | "warn" } | null {
  if (score == null) return null
  if (score >= 75) return { label: "Verified", tone: "good" }
  if (score >= 50) return { label: "Trusted", tone: "ok" }
  if (score < 30) return { label: "Verify before applying", tone: "warn" }
  return null
}

export function postedAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime())
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return "Just now"
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  const m = Math.floor(d / 30)
  return `${m}mo ago`
}

export function isFresh(iso: string, now = Date.now()): boolean {
  return now - new Date(iso).getTime() < 48 * 3_600_000
}

/** Stable, muted monogram colour per company. */
export function monogram(name: string): { letters: string; hue: number } {
  const words = name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean)
  const letters = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] || "?").slice(0, 2)).toUpperCase()
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  return { letters, hue: h }
}
