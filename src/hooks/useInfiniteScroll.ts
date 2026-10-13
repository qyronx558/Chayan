"use client"

import { useEffect, useRef } from "react"

interface UseInfiniteScrollOptions {
  /** Whether more pages exist. Observer disconnects when false. */
  hasMore: boolean
  /** True while initial load or append is in flight - suppresses re-trigger. */
  isLoading: boolean
  /** Called when the sentinel scrolls into view (auto-load next batch). */
  onLoadMore: () => void
  /** Prefetch distance. Larger = earlier Amazon-style preload. */
  rootMargin?: string
}

/**
 * Amazon-style auto-load: watches a sentinel div and calls `onLoadMore`
 * when the user scrolls near the bottom. The manual `Load More` button
 * (rendered by `InfiniteListFooter`) stays as fallback, so this is a
 * hybrid infinite-scroll, not a pager replacement that strands keyboard users.
 */
export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = "500px",
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const callbackRef = useRef(onLoadMore)

  useEffect(() => {
    callbackRef.current = onLoadMore
  }, [onLoadMore])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    if (typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          callbackRef.current()
        }
      },
      { root: null, rootMargin, threshold: 0 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, rootMargin, isLoading])

  return sentinelRef
}

/** Fixed batch size for every public card grid (3-col friendly). */
export const PUBLIC_INFINITE_LIMIT = 12

/** Append `incoming` to `prev` without duplicates (API overlap guard). */
export function appendUnique<T extends { id: string }>(prev: T[], incoming: T[]): T[] {
  if (prev.length === 0) return incoming
  const seen = new Set(prev.map((i) => i.id))
  const fresh = incoming.filter((i) => !seen.has(i.id))
  return fresh.length === 0 ? prev : [...prev, ...fresh]
}
