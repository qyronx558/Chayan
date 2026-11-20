import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse } from "next/server"

export const CACHE_POLICY = {
  gov: { sMaxAge: 21600, swr: 86400 },
  // Private data changes with the 3-hourly feed sync, which also bumps the
  // data version that busts these URLs from regenerated pages.
  private: { sMaxAge: 10800, swr: 86400 },
  blog: { sMaxAge: 86400, swr: 86400 },
  search: { sMaxAge: 900, swr: 3600 },
  static: { sMaxAge: 86400, swr: 604800 },
} as const

export type CachePolicy = keyof typeof CACHE_POLICY

export const CACHE_TAGS = {
  taxonomy: "taxonomy",
  locations: "locations",
  govCounts: "gov-counts",
  privateFilters: "private-filters",
} as const

export function cacheControl(policy: CachePolicy | number) {
  const { sMaxAge, swr } = typeof policy === "number" ? { sMaxAge: policy, swr: policy * 2 } : CACHE_POLICY[policy]
  return `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`
}

export function publicApiResponse<T>(body: T, policy: CachePolicy | number = 60) {
  return NextResponse.json(body, { headers: { "Cache-Control": cacheControl(policy) } })
}

export function noStoreResponse<T>(body: T, init?: ResponseInit) {
  const headers = new Headers(init?.headers)
  headers.set("Cache-Control", "private, no-store")
  return NextResponse.json(body, { ...init, headers })
}

export type ContentKind =
  | "job"
  | "private-job"
  | "result"
  | "admit-card"
  | "admission"
  | "answer-key"
  | "syllabus"
  | "blog"
  | "featured"

export interface RevalidateScope {
  categorySlugs?: (string | null | undefined)[]
  stateSlug?: string | null
  districtSlug?: string | null
  companySlug?: string | null
}

const LIST_ROUTES: Record<ContentKind, string[]> = {
  job: ["/jobs", "/jobs/states"],
  "private-job": ["/private-jobs", "/private-jobs/remote", "/private-jobs/freshers", "/private-jobs/walkins"],
  result: ["/results"],
  "admit-card": ["/admit-cards"],
  admission: ["/admissions"],
  "answer-key": ["/answer-keys"],
  syllabus: ["/syllabus"],
  blog: ["/blog"],
  featured: [],
}

const DETAIL_ROUTE: Partial<Record<ContentKind, string>> = {
  job: "/apply",
  "private-job": "/private-jobs",
  result: "/result",
  "admit-card": "/admit-card",
  admission: "/admission",
  "answer-key": "/answer-key",
  syllabus: "/syllabus",
  blog: "/blog",
}

const DETAIL_SUBPAGES: Partial<Record<ContentKind, string[]>> = {
  job: ["/start"],
  "private-job": ["/apply"],
  result: ["/view"],
  "admit-card": ["/view"],
  admission: ["/view"],
  "answer-key": ["/view"],
  syllabus: ["/view"],
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path)
  } catch {}
}

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag, "max")
  } catch {}
}

export function revalidateTags(tags: string[]) {
  for (const tag of tags) safeRevalidateTag(tag)
}

export function revalidateLocationPages(stateSlug?: string | null, districtSlug?: string | null) {
  safeRevalidateTag(CACHE_TAGS.locations)
  safeRevalidatePath("/jobs/states")
  if (stateSlug) safeRevalidatePath(`/jobs/state/${stateSlug}`)
  if (stateSlug && districtSlug) safeRevalidatePath(`/jobs/district/${stateSlug}/${districtSlug}`)
}

export function revalidatePublicContent(kind: ContentKind, slug?: string | null, scope: RevalidateScope = {}) {
  const paths = new Set<string>(["/", ...LIST_ROUTES[kind]])
  const detail = DETAIL_ROUTE[kind]
  if (slug && detail) {
    paths.add(`${detail}/${slug}`)
    for (const sub of DETAIL_SUBPAGES[kind] ?? []) paths.add(`${detail}/${slug}${sub}`)
  }
  for (const category of scope.categorySlugs ?? []) if (category) paths.add(`/category/${category}`)
  if (scope.stateSlug) paths.add(`/jobs/state/${scope.stateSlug}`)
  if (scope.stateSlug && scope.districtSlug) paths.add(`/jobs/district/${scope.stateSlug}/${scope.districtSlug}`)
  if (scope.companySlug) paths.add(`/companies/${scope.companySlug}`)
  for (const path of paths) safeRevalidatePath(path)
  if (kind === "job") safeRevalidateTag(CACHE_TAGS.govCounts)
  if (kind === "private-job") safeRevalidateTag(CACHE_TAGS.privateFilters)
}
