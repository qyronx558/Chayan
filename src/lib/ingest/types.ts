/**
 * Shared types for the content-ingest pipeline (scraper ⇄ /api/cron/ingest).
 * Kept dependency-free so both the Node scraper and the Next.js routes use it.
 */

export const INGEST_KINDS = ["jobs", "results", "admit-cards", "answer-keys", "admissions", "syllabus"] as const
export type IngestKind = (typeof INGEST_KINDS)[number]

export type SourceLevel = "CENTRAL" | "STATE" | "DISTRICT"

export interface SourceDef {
  /** Stable id, e.g. "upsc" or "nic:bihar/patna". Used for dedupe + stats. */
  id: string
  name: string
  level: SourceLevel
  adapter: "nic-s3waas" | "html-links"
  url: string
  /** Extra listing pages of the same source (e.g. results + recruitment pages). */
  extraUrls?: string[]
  /** Exact names of seeded State / District rows (required for STATE / DISTRICT). */
  state?: string
  district?: string
  /** Department used when the notice itself does not name one. */
  department?: string
  /** html-links: CSS selector that scopes link harvesting (defaults to <main>/<body>). */
  scope?: string
  /** html-links: only keep links whose href matches this regex (source string). */
  include?: string
  /** Hosts that official links for this source may point to (in addition to *.gov.in / *.nic.in). */
  allowHosts?: string[]
  /** Cadence bucket used by the scheduler. */
  schedule?: "frequent" | "daily"
  disabled?: boolean
}

export interface ListingLink {
  url: string
  label: string
}

/** One notice row found on a listing page, before any LLM work. */
export interface ListingItem {
  sourceId: string
  /** Canonical URL used for dedupe (first PDF, or the detail page). */
  url: string
  title: string
  description?: string
  startDate?: string
  endDate?: string
  links: ListingLink[]
}
