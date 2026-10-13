"use client"

import { useEffect, useRef } from "react"

export type TrackedEntityType =
  | "JOB"
  | "PRIVATE_JOB"
  | "RESULT"
  | "ADMIT_CARD"
  | "ANSWER_KEY"
  | "SYLLABUS"
  | "ADMISSION"
  | "BLOG"

function sessionId(): string {
  try {
    let v = sessionStorage.getItem("cj_sid")
    if (!v) {
      v = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem("cj_sid", v)
    }
    return v
  } catch {
    return `${Date.now().toString(36)}`
  }
}

/**
 * Fires one enriched page-view event carrying entityType + entityId so the
 * trending engine can attribute detail-page traffic per content item.
 * The global Tracker (layout) still sends the plain path event; both are
 * counted, which is consistent across all modules for relative ranking.
 * Bots are filtered server-side via userAgentClass.
 */
export function EntityViewTracker({
  entityType,
  entityId,
}: {
  entityType: TrackedEntityType
  entityId: string
}) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    if (
      typeof navigator !== "undefined" &&
      (navigator as Navigator & { doNotTrack?: string }).doNotTrack === "1"
    )
      return
    const body = JSON.stringify({
      path: window.location.pathname,
      entityType,
      entityId,
      referrer: document.referrer || undefined,
      sessionId: sessionId(),
    })
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track/view", new Blob([body], { type: "application/json" }))
      } else {
        fetch("/api/track/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => null)
      }
    } catch {
      /* ignore */
    }
  }, [entityType, entityId])

  return null
}
