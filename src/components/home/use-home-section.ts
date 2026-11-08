"use client"

import { useCallback, useEffect, useState } from "react"
import type { HomeTab } from "./SectionTabs"

export interface TrendingMeta {
 fallback: boolean
 windowDays: number
}

interface HomeSectionState {
 latest: Array<Record<string, unknown>> | null
 trending: Array<Record<string, unknown>> | null
 trendingMeta: TrendingMeta | null
 tab: HomeTab
 selectTab: (tab: HomeTab) => void
 loading: boolean
 trendingLoading: boolean
}

/**
 * Shared data layer for home sections with Latest | Trending tabs.
 * Latest loads on mount; trending loads lazily on first tab switch and
 * is cached for the session. Both endpoints share the same item shape.
 */
export function useHomeSection(latestUrl: string, trendingUrl: string): HomeSectionState {
 const [latest, setLatest] = useState<Array<Record<string, unknown>> | null>(null)
 const [trending, setTrending] = useState<Array<Record<string, unknown>> | null>(null)
 const [trendingMeta, setTrendingMeta] = useState<TrendingMeta | null>(null)
 const [tab, setTab] = useState<HomeTab>("latest")
 const [trendingLoading, setTrendingLoading] = useState(false)

 useEffect(() => {
  let cancelled = false
  fetch(latestUrl)
   .then((res) => res.json())
   .then((data) => {
    if (!cancelled && data.success) setLatest(data.data)
   })
   .catch(() => {
    if (!cancelled) setLatest([])
   })
  return () => {
   cancelled = true
  }
 }, [latestUrl])

 const selectTab = useCallback(
  (next: HomeTab) => {
   setTab(next)
   if (next === "trending" && trending === null && !trendingLoading) {
    setTrendingLoading(true)
    fetch(trendingUrl)
     .then((res) => res.json())
     .then((data) => {
      if (data.success) {
       setTrending(data.data)
       if (data.trending) setTrendingMeta(data.trending)
      } else {
       setTrending([])
      }
     })
     .catch(() => setTrending([]))
     .finally(() => setTrendingLoading(false))
   }
  },
  [trending, trendingLoading, trendingUrl]
 )

 return { latest, trending, trendingMeta, tab, selectTab, loading: latest === null, trendingLoading }
}
