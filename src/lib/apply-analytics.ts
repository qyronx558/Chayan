/**
 * Lightweight analytics for Application Mode.
 * Fires gtag events only when GA is loaded; never throws.
 * Existing DB trackers (ApplicationTracker/JobViewTracker) are untouched.
 */

import type { ApplyAnalyticsPayload } from "@/components/apply/application-types"

export type ApplyAnalyticsEvent =
  | "application_page_opened"
  | "apply_cta_clicked"
  | "official_site_opened"
  | "iframe_loaded"
  | "iframe_failed"
  | "sidebar_collapsed"
  | "job_info_opened"
  | "report_issue_clicked"

export function trackApplyEvent(event: ApplyAnalyticsEvent, payload: ApplyAnalyticsPayload): void {
  if (typeof window === "undefined") return
  const gtag = (window as unknown as { gtag?: unknown }).gtag
  if (typeof gtag !== "function") return
  try {
    ;(gtag as (name: string, eventName: string, params: Record<string, string>) => void)(
      "event",
      event,
      {
        job_id: payload.job_id,
        job_slug: payload.job_slug,
        job_type: payload.job_type,
        destination_domain: payload.destination_domain,
      }
    )
  } catch {
    // Analytics must never break the application flow.
  }
}
