"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { beacon, sessionId, takeEntity } from "./page-view-store"

const VITALS_SAMPLE_RATE = 0.25

export function Tracker() {
  const pathname = usePathname()
  const search = useSearchParams()
  useEffect(() => {
    if ((navigator as Navigator & { doNotTrack?: string }).doNotTrack === "1") return
    const path = pathname ?? "/"
    const started = Date.now()
    const sid = sessionId()
    const utm = search ?? new URLSearchParams()
    beacon("/api/track/view", {
      path,
      ...takeEntity(path),
      referrer: document.referrer || undefined,
      utmSource: utm.get("utm_source") ?? undefined,
      utmMedium: utm.get("utm_medium") ?? undefined,
      utmCampaign: utm.get("utm_campaign") ?? undefined,
      sessionId: sid,
    })
    if (Math.random() >= VITALS_SAMPLE_RATE) return
    let lcp = 0
    const po =
      typeof PerformanceObserver !== "undefined"
        ? new PerformanceObserver((list) => {
            for (const e of list.getEntries()) {
              if (e.entryType === "largest-contentful-paint") lcp = Math.max(lcp, e.startTime)
            }
          })
        : null
    try {
      po?.observe({ type: "largest-contentful-paint", buffered: true })
    } catch {}
    const sendVitals = () => {
      const metrics = [{ metric: "time-on-page", value: Math.round((Date.now() - started) / 1000) }]
      if (lcp > 0) metrics.push({ metric: "LCP", value: Math.round(lcp) })
      beacon("/api/track/vitals", { metrics, path, sessionId: sid })
      po?.disconnect()
    }
    window.addEventListener("pagehide", sendVitals, { once: true })
    return () => window.removeEventListener("pagehide", sendVitals)
  }, [pathname, search])
  return null
}
