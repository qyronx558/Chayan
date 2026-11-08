"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { Search, AlertCircle, Calendar, FileCheck2, X } from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { SectionHero } from "@/components/layout/SectionHero"
import { UniversalCard, UniversalCardSkeleton, UniversalCardEmpty } from "@/components/ui/universal-card"
import { CardShareButton } from "@/components/ui/card-actions"
import { moduleTheme } from "@/components/ui/module-theme"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"
import { formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
 useInfiniteScroll,
 appendUnique,
 PUBLIC_INFINITE_LIMIT as LIMIT,
} from "@/hooks/useInfiniteScroll"
import { InfiniteListFooter } from "@/components/ui/infinite-list-footer"

interface ResultData {
 id: string
 title: string
 slug: string
 description: string | null
 pdfUrl: string | null
 resultDate: string | null
 status: string | null
 createdAt: string
 department: { id: string; name: string; slug: string }
 category: { id: string; name: string; slug: string }
}

export function ResultsClient() {
 const [results, setResults] = useState<ResultData[]>([])
 const [total, setTotal] = useState(0)
 const [hasMore, setHasMore] = useState(false)
 const [loading, setLoading] = useState(true)
 const [loadingMore, setLoadingMore] = useState(false)
 const [error, setError] = useState("")
 const [loadMoreError, setLoadMoreError] = useState("")
 const [search, setSearch] = useState("")
 const [debouncedSearch, setDebouncedSearch] = useState("")
 const pageRef = useRef(1)
 const abortRef = useRef<AbortController | null>(null)

 useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
  return () => clearTimeout(timer)
 }, [search])

 const fetchPage = useCallback(async (pageNum: number, replace: boolean, signal: AbortSignal) => {
  if (replace) {
   setLoading(true)
   setError("")
  } else {
   setLoadingMore(true)
   setLoadMoreError("")
  }
  try {
   const params = new URLSearchParams()
   if (debouncedSearch) params.set("search", debouncedSearch)
   params.set("page", String(pageNum))
   params.set("limit", String(LIMIT))

   const res = await fetch(`/api/results?${params}`, { signal })
   const json = await res.json()
   if (signal.aborted) return
   if (json.success) {
    setResults((prev) => (replace ? json.data : appendUnique(prev, json.data)))
    setTotal(json.pagination.total ?? 0)
    setHasMore(pageNum < (json.pagination.totalPages ?? 1))
    pageRef.current = pageNum
   } else if (replace) {
    setError(json.error || "Failed to fetch results")
   } else {
    setLoadMoreError(json.error || "Failed to load more. Please retry.")
   }
  } catch {
   if (signal.aborted) return
   if (replace) setError("Failed to fetch results. Please try again.")
   else setLoadMoreError("Failed to load more. Please retry.")
  } finally {
   if (!signal.aborted) {
    if (replace) setLoading(false)
    else setLoadingMore(false)
   }
  }
 }, [debouncedSearch])

 // Initial load + reset whenever the search query changes.
 useEffect(() => {
  abortRef.current?.abort()
  const controller = new AbortController()
  abortRef.current = controller
  pageRef.current = 1
  setHasMore(false)
  fetchPage(1, true, controller.signal)
  return () => controller.abort()
 }, [fetchPage])

 const loadMore = useCallback(() => {
  if (loading || loadingMore || !hasMore) return
  const controller = new AbortController()
  abortRef.current = controller
  fetchPage(pageRef.current + 1, false, controller.signal)
 }, [loading, loadingMore, hasMore, fetchPage])

 const retryInitial = useCallback(() => {
  abortRef.current?.abort()
  const controller = new AbortController()
  abortRef.current = controller
  fetchPage(1, true, controller.signal)
 }, [fetchPage])

 const sentinelRef = useInfiniteScroll({
  hasMore,
  isLoading: loading || loadingMore,
  onLoadMore: loadMore,
 })

 return (
  <div className="container mx-auto max-w-7xl px-4 py-8">
   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
    <SectionHero
     icon={FileCheck2}
     badge="Results"
     title="Exam Results"
     subtitle="Download the latest government exam result PDFs and check your outcome in one place."
     count={total}
    />

    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
     <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
       placeholder="Search results..."
       value={search}
       onChange={(e) => { setSearch(e.target.value) }}
       className="pl-10 pr-10"
      />
      {search && (
       <button
        type="button"
        onClick={() => { setSearch("") }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
       >
        <X className="h-4 w-4" />
       </button>
      )}
     </div>
    </div>
{loading ? (
     <div className={moduleTheme.result.listGrid}>
      {Array.from({ length: LIMIT }).map((_, i) => (
       <UniversalCardSkeleton key={i} />
      ))}
     </div>
    ) : error ? (
     <Card>
      <CardContent className="flex flex-col items-center py-16">
       <AlertCircle className="mb-4 h-12 w-12 text-brick" />
       <h3 className="mb-2 text-lg font-semibold text-foreground">Something went wrong</h3>
       <p className="mb-4 text-sm text-muted-foreground">{error}</p>
       <Button onClick={retryInitial}>Try Again</Button>
      </CardContent>
     </Card>
    ) : filterValidItems(results).length === 0 ? (
     <UniversalCardEmpty title="No results found" hint="Try adjusting your search or check back later for new results." />
    ) : (
     <>
      <div className="mb-4 text-sm text-muted-foreground">
       Showing {filterValidItems(results).length} of {total} results
      </div>
      <div className={moduleTheme.result.listGrid}>
       {filterValidItems(results).map((result) => (
        <motion.div
         key={result.id}
         initial={{ opacity: 0, y: 24 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true, margin: "-40px" }}
         transition={{ duration: 0.35 }}
         className="h-full"
        >
         <UniversalCard
         module="result"
         title={cleanTitle(result.title)}
         organization={result.department.name}
         description={result.description}
         metadata={result.resultDate ? [{ icon: Calendar, text: formatDate(result.resultDate) }] : []}
         primaryCtaUrl={`/result/${result.slug}`}
         save={<BookmarkButton resultId={result.id} />}
         share={<CardShareButton title={cleanTitle(result.title)} url={`/result/${result.slug}`} />}
        />
        </motion.div>
       ))}
      </div>
      {loadingMore && (
       <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
         <UniversalCardSkeleton key={i} />
        ))}
       </div>
      )}
      <InfiniteListFooter
       sentinelRef={sentinelRef}
       hasMore={hasMore}
       loadingMore={loadingMore}
       loadMoreError={loadMoreError}
       onLoadMore={loadMore}
       onRetry={loadMore}
       loadedCount={filterValidItems(results).length}
       total={total}
       label="results"
      />
     </>
    )}
   </motion.div>
  </div>
 )
}
