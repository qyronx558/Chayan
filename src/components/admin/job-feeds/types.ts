export type Provider =
  | "GREENHOUSE"
  | "LEVER"
  | "ASHBY"
  | "SMARTRECRUITERS"
  | "WORKABLE"
  | "RECRUITEE"
  | "PERSONIO"
  | "BREEZY"
  | "CAREER_PAGE"

export interface FeedStats {
  fetched: number
  created: number
  pendingReview?: number
  updated: number
  unchanged: number
  reopened: number
  closed: number
  duplicates: number
  skipped: number
  overflow: number
  method?: string
}

export interface FeedRow {
  id: string
  provider: Provider
  boardToken: string
  boardUrl: string
  pageUrl: string | null
  enabled: boolean
  indiaOnly: boolean
  lastRunAt: string | null
  lastStatus: "OK" | "HELD" | "ERROR" | null
  lastError: string | null
  lastStats: FeedStats | null
  createdAt: string
  company: { id: string; name: string; slug: string; verifiedStatus: string }
  jobs: { active: number; expired: number }
}

export interface FeedsResponse {
  data: FeedRow[]
  summary: { feeds: number; enabled: number; problems: number; liveJobs: number; created24h: number; pendingReview: number; missingLogos: number }
}

export interface FeedSettings {
  enabled: boolean
  intervalHours: number
  autoPublishAi: boolean
  minConfidence: number
  maxAiPagesPerRun: number
  geminiModel: string | null
  saved: boolean
  updatedAt: string | null
}

export interface SettingsResponse {
  settings: FeedSettings
  environment: { geminiConfigured: boolean; effectiveModel: string; cronConfigured: boolean }
}

export interface CatalogRow {
  id: string
  company: string
  website: string | null
  provider: Provider
  token: string
  sector: string
  jobs?: number
  added: boolean
}

export const PROVIDER_LABEL: Record<Provider, string> = {
  GREENHOUSE: "Greenhouse",
  LEVER: "Lever",
  ASHBY: "Ashby",
  SMARTRECRUITERS: "SmartRecruiters",
  WORKABLE: "Workable",
  RECRUITEE: "Recruitee",
  PERSONIO: "Personio",
  BREEZY: "Breezy HR",
  CAREER_PAGE: "Careers page · AI",
}

export const METHOD_LABEL: Record<string, string> = {
  jsonld: "Structured data",
  ats: "Embedded board",
  ai: "Gemini",
  unchanged: "Unchanged",
  none: "Nothing found",
}

export function statsLine(s: FeedStats | null): string {
  if (!s) return "Not run yet"
  const parts = [`${s.fetched} listed`, `+${s.created} new`]
  if (s.pendingReview) parts.push(`${s.pendingReview} to review`)
  parts.push(`${s.updated} updated`, `${s.closed} closed`)
  if (s.duplicates) parts.push(`${s.duplicates} duplicates`)
  if (s.overflow) parts.push(`${s.overflow} queued`)
  return parts.join(" · ")
}

export interface DiscoveryResponse {
  counts: { PENDING: number; FOUND: number; NOT_FOUND: number; ERROR: number }
  data: { id: string; name: string; status: string; provider: string | null; boardToken: string | null; jobs: number | null; note: string | null; checkedAt: string | null }[]
}
