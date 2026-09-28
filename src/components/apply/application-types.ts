/**
 * Shared types for the unified "Application Mode" shell.
 * Used by both government (/apply/[slug]/start) and
 * private (/private-jobs/[slug]/apply) application routes.
 */

export type ApplicationType = "government" | "private"

export interface ApplicationInfoRow {
  label: string
  value: string
}

export interface ApplicationShellProps {
  type: ApplicationType
  jobId: string
  slug: string
  /** Short display title (already truncated server-side if needed). */
  title: string
  /** Department name (gov) or company name (private). */
  organization: string
  /** Verified, normalized https application URL. */
  officialUrl: string
  /** Readable hostname, e.g. "bpsc.bih.nic.in". */
  hostname: string
  /** Pre-formatted deadline label, e.g. "30 Sep 2026", or null. */
  deadlineLabel?: string | null
  /** Pre-formatted "last checked" label, or null. */
  updatedLabel?: string | null
  /** e.g. "Government Portal" | "Company Careers" */
  sourceLabel: string
  /** Back navigation target (job detail page). */
  backHref: string
  /** Back label, e.g. "Job details". */
  backLabel: string
  /** Rows shown in the job-info drawer. */
  infoRows: ApplicationInfoRow[]
}

export interface ApplyAnalyticsPayload {
  job_id: string
  job_slug: string
  job_type: ApplicationType
  destination_domain: string
}
