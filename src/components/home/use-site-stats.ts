"use client"

import { useEffect, useState } from "react"

export interface SiteStats {
  activeJobs: number
  totalResults: number
  totalAdmitCards: number
  totalAnswerKeys: number
  totalPrivateJobs: number
  totalAdmissions: number
  totalSyllabus: number
  totalUsers: number
}

let cache: Promise<SiteStats | null> | null = null

function loadStats(): Promise<SiteStats | null> {
  if (!cache) {
    cache = fetch("/api/stats/public")
      .then((r) => r.json())
      .then((d) => (d.success ? (d.data as SiteStats) : null))
      .catch(() => {
        cache = null
        return null
      })
  }
  return cache
}

/** `/api/stats/public` (CDN-cached) shared by every home section, fetched once per page load. */
export function useSiteStats(): SiteStats | null {
  const [stats, setStats] = useState<SiteStats | null>(null)
  useEffect(() => {
    let cancelled = false
    loadStats().then((s) => !cancelled && setStats(s))
    return () => {
      cancelled = true
    }
  }, [])
  return stats
}
