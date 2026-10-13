"use client"

import type { RefObject } from "react"
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface InfiniteListFooterProps {
  sentinelRef: RefObject<HTMLDivElement | null>
  hasMore: boolean
  loadingMore: boolean
  /** Non-fatal append error (list stays visible, retry only the next page). */
  loadMoreError?: string
  onLoadMore: () => void
  onRetry?: () => void
  loadedCount: number
  total: number
  /** e.g. "jobs", "results" - used in the end-of-list message. */
  label?: string
}

/**
 * Hybrid infinite-scroll footer: invisible sentinel triggers auto-load,
 * plus a visible Load More button, loading state, append-error retry,
 * and an end-of-list message. Render it below every public card grid.
 */
export function InfiniteListFooter({
  sentinelRef,
  hasMore,
  loadingMore,
  loadMoreError,
  onLoadMore,
  onRetry,
  loadedCount,
  total,
  label = "items",
}: InfiniteListFooterProps) {
  return (
    <div className="mt-8 flex flex-col items-center gap-3" aria-live="polite">
      {/* Invisible trigger - auto-loads next batch like Amazon product lists */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />

      {loadMoreError && !loadingMore && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-red-600">{loadMoreError}</p>
          <Button variant="outline" size="sm" onClick={onRetry ?? onLoadMore}>
            Retry
          </Button>
        </div>
      )}

      {loadingMore && (
        <div className="flex items-center gap-2 text-sm text-gray-500" role="status">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading more {label}…
        </div>
      )}

      {hasMore && !loadingMore && !loadMoreError && (
        <Button variant="outline" onClick={onLoadMore}>
          Load More
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      )}

      {!hasMore && loadedCount > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-gray-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          You&apos;ve seen all {total} {label}
        </p>
      )}
    </div>
  )
}
