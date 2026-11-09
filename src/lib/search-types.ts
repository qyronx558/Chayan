// Client-safe types + metadata for the ChayanJobs advanced search engine.
// The server engine lives in `search-engine.ts` (imports prisma).

export type SearchKind =
  | "job"
  | "private_job"
  | "result"
  | "admit_card"
  | "answer_key"
  | "syllabus"
  | "admission"
  | "notification"
  | "blog"

export const SEARCH_KINDS: SearchKind[] = [
  "job",
  "private_job",
  "result",
  "admit_card",
  "answer_key",
  "syllabus",
  "admission",
  "notification",
  "blog",
]

export const SEARCH_KIND_META: Record<
  SearchKind,
  { label: string; singular: string; listHref: string }
> = {
  job: { label: "Govt Jobs", singular: "Govt Job", listHref: "/jobs" },
  private_job: { label: "Private Jobs", singular: "Private Job", listHref: "/private-jobs" },
  result: { label: "Results", singular: "Result", listHref: "/results" },
  admit_card: { label: "Admit Cards", singular: "Admit Card", listHref: "/admit-cards" },
  answer_key: { label: "Answer Keys", singular: "Answer Key", listHref: "/answer-keys" },
  syllabus: { label: "Syllabus", singular: "Syllabus", listHref: "/syllabus" },
  admission: { label: "Admissions", singular: "Admission", listHref: "/admissions" },
  notification: { label: "Notifications", singular: "Notification", listHref: "/notifications" },
  blog: { label: "Blog", singular: "Article", listHref: "/blog" },
}

/**
 * A one-click action on a result. `href` is ALWAYS either an internal route or
 * an in-app browser route (/browse?url=…), so the form / PDF opens inside
 * ChayanJobs. Clients open every action in a NEW tab.
 */
export interface SearchAction {
  kind: "apply" | "open" | "pdf" | "website"
  label: string
  href: string
  primary?: boolean
}

export interface SearchHit {
  id: string
  kind: SearchKind
  title: string
  slug: string
  /** Internal detail-page route. */
  href: string
  /** Department / company / category line. */
  subtitle: string | null
  location: string | null
  /** Short snippet (HTML-free) taken from the description / content. */
  snippet: string | null
  /** ISO date used for "latest" sort and the card date. */
  date: string
  /** ISO deadline for jobs / admissions. */
  lastDate: string | null
  /** "open" | "closing" | "closed" | "upcoming" | null */
  state: "open" | "closing" | "closed" | "upcoming" | null
  vacancies: number | null
  salary: string | null
  status: string | null
  trending?: boolean
  actions: SearchAction[]
  score: number
}

export interface SearchResponse {
  success: boolean
  query: string
  tokens: string[]
  /** "Did you mean" – best alternative query when there are no/few hits. */
  suggestion: string | null
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  /** Counts per kind for the current query (ignores the `type` filter). */
  facets: Record<SearchKind, number>
  hits: SearchHit[]
  tookMs: number
}

export type SearchSort = "relevance" | "latest" | "deadline"
export type SearchWithin = "" | "1" | "7" | "30" | "90"
