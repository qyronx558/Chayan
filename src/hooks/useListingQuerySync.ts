"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export type ListingQueryState = Record<string, string | undefined>

/**
 * Mirrors the current filter state into the URL so results are shareable
 * and bookmarkable. Unknown query params are preserved. Debounced to avoid
 * adding a history entry on every keystroke.
 *
 * Must be rendered inside a Suspense boundary because it reads
 * `useSearchParams()`.
 */
export function useListingQuerySync(state: ListingQueryState) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const stateKey = JSON.stringify(state)
  const lastWrittenRef = useRef<string | null>(null)

  useEffect(() => {
    const current = new URLSearchParams(window.location.search)
    const parsed = JSON.parse(stateKey) as ListingQueryState

    for (const [key, value] of Object.entries(parsed)) {
      if (value && value !== "all") current.set(key, value)
      else current.delete(key)
    }

    const nextQuery = current.toString()
    const browserQuery = window.location.search.replace(/^\?/, "")
    if (nextQuery === browserQuery) return
    if (lastWrittenRef.current === nextQuery) return

    const timer = setTimeout(() => {
      lastWrittenRef.current = nextQuery
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
    }, 350)

    return () => clearTimeout(timer)
  }, [stateKey, pathname, router, searchParams])
}
