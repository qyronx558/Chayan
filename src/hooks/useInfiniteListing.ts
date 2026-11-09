"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { appendUnique, PUBLIC_INFINITE_LIMIT, useInfiniteScroll } from "@/hooks/useInfiniteScroll"

type FilterValue = string | number | boolean | null | undefined

interface UseInfiniteListingOptions {
  endpoint: string
  params: Record<string, FilterValue>
  limit?: number
  enabled?: boolean
}

interface ListingResponse<T> {
  success?: boolean
  data?: T[]
  error?: string
  pagination?: { page?: number; limit?: number; total?: number; totalPages?: number }
}

/**
 * Shared list state for public catalogue pages.
 * - aborts stale requests when filters change
 * - keeps the current results visible while a filter refresh is in flight
 * - appends unique pages for infinite scroll
 */
export function useInfiniteListing<T extends { id: string }>({
  endpoint,
  params,
  limit = PUBLIC_INFINITE_LIMIT,
  enabled = true,
}: UseInfiniteListingOptions) {
  const paramsKey = JSON.stringify(params)

  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [loadMoreError, setLoadMoreError] = useState("")

  const pageRef = useRef(1)
  const abortRef = useRef<AbortController | null>(null)
  const loadedOnceRef = useRef(false)

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean, signal: AbortSignal) => {
      if (replace) {
        if (loadedOnceRef.current) setRefreshing(true)
        else setLoading(true)
        setError("")
      } else {
        setLoadingMore(true)
        setLoadMoreError("")
      }

      try {
        const query = new URLSearchParams()
        const parsed = JSON.parse(paramsKey) as Record<string, FilterValue>
        for (const [key, value] of Object.entries(parsed)) {
          if (value === undefined || value === null || value === "" || value === false) continue
          query.set(key, String(value))
        }
        query.set("page", String(pageNum))
        query.set("limit", String(limit))

        const res = await fetch(`${endpoint}?${query.toString()}`, { signal })
        const json = (await res.json()) as ListingResponse<T>
        if (signal.aborted) return

        if (json.success) {
          const pageItems = json.data ?? []
          setItems((prev) => (replace ? pageItems : appendUnique(prev, pageItems)))
          setTotal(json.pagination?.total ?? 0)
          setHasMore(pageNum < (json.pagination?.totalPages ?? 1))
          pageRef.current = pageNum
          loadedOnceRef.current = true
        } else if (replace) {
          setError(json.error || "Failed to load content")
        } else {
          setLoadMoreError(json.error || "Failed to load more. Please retry.")
        }
      } catch {
        if (signal.aborted) return
        if (replace) setError("Failed to load content. Please try again.")
        else setLoadMoreError("Failed to load more. Please retry.")
      } finally {
        if (!signal.aborted) {
          setLoading(false)
          setRefreshing(false)
          setLoadingMore(false)
        }
      }
    },
    [endpoint, paramsKey, limit]
  )

  useEffect(() => {
    if (!enabled) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    pageRef.current = 1
    setHasMore(false)
    fetchPage(1, true, controller.signal)
    return () => controller.abort()
  }, [fetchPage, enabled])

  const loadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || !hasMore) return
    const controller = new AbortController()
    abortRef.current = controller
    fetchPage(pageRef.current + 1, false, controller.signal)
  }, [loading, refreshing, loadingMore, hasMore, fetchPage])

  const retry = useCallback(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    pageRef.current = 1
    fetchPage(1, true, controller.signal)
  }, [fetchPage])

  const sentinelRef = useInfiniteScroll({
    hasMore,
    isLoading: loading || refreshing || loadingMore,
    onLoadMore: loadMore,
  })

  return {
    items,
    total,
    hasMore,
    loading,
    refreshing,
    loadingMore,
    error,
    loadMoreError,
    loadMore,
    retry,
    sentinelRef,
  }
}
