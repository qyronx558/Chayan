"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { Search, AlertCircle, Download, Book, X, BookOpen } from "lucide-react"
import { SectionHero } from "@/components/layout/SectionHero"
import { ContentCard, ContentCardSkeleton } from "@/components/ui/content-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  useInfiniteScroll,
  appendUnique,
  PUBLIC_INFINITE_LIMIT as LIMIT,
} from "@/hooks/useInfiniteScroll"
import { InfiniteListFooter } from "@/components/ui/infinite-list-footer"

interface SyllabusData {
  id: string
  title: string
  slug: string
  description: string | null
  subjects: string | null
  pdfUrl: string | null
  status: string | null
  department: { id: string; name: string; slug: string }
}

export function SyllabusClient() {
  const [items, setItems] = useState<SyllabusData[]>([])
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

      const res = await fetch(`/api/syllabus?${params}`, { signal })
      const json = await res.json()
      if (signal.aborted) return
      if (json.success) {
        setItems((prev) => (replace ? json.data : appendUnique(prev, json.data)))
        setTotal(json.pagination.total ?? 0)
        setHasMore(pageNum < (json.pagination.totalPages ?? 1))
        pageRef.current = pageNum
      } else if (replace) {
        setError(json.error || "Failed to fetch syllabus")
      } else {
        setLoadMoreError(json.error || "Failed to load more. Please retry.")
      }
    } catch {
      if (signal.aborted) return
      if (replace) setError("Failed to fetch syllabus. Please try again.")
      else setLoadMoreError("Failed to load more. Please retry.")
    } finally {
      if (!signal.aborted) {
        if (replace) setLoading(false)
        else setLoadingMore(false)
      }
    }
  }, [debouncedSearch])

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

  const getSubjectsList = (subjects: string | null): string[] => {
    if (!subjects) return []
    try {
      const parsed = JSON.parse(subjects)
      return Array.isArray(parsed) ? parsed.slice(0, 4) : [subjects]
    } catch {
      return subjects.split(",").map((s) => s.trim()).slice(0, 4)
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SectionHero
          icon={BookOpen}
          badge="Syllabus"
          title="Syllabus"
          subtitle="Download detailed subject-wise syllabus for government exams and plan your preparation."
          count={total}
        />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search syllabus..."
              value={search}
              onChange={(e) => { setSearch(e.target.value) }}
              className="pl-10 pr-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch("") }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Something went wrong</h3>
              <p className="mb-4 text-sm text-gray-500">{error}</p>
              <Button onClick={retryInitial}>Try Again</Button>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <Search className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No syllabus found</h3>
              <p className="text-sm text-gray-500">
                Try adjusting your search or check back later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Showing {items.length} of {total} syllabus entries
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35 }}
                >
                  <ContentCard
                  icon={BookOpen}
                  iconClassName="from-rose-500 to-pink-700"
                  badge={<Badge variant="secondary" className="max-w-[65%] truncate bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{item.department.name}</Badge>}
                  statusBadge={<span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">Syllabus</span>}
                  title={item.title}
                  description={item.description}
                  meta={getSubjectsList(item.subjects).length > 0 ? [{ icon: Book, text: getSubjectsList(item.subjects).join(", ") }] : []}
                  href={`/syllabus/${item.slug}`}
                  ctaLabel="View Syllabus"
                  footer={
                    item.pdfUrl ? (
                      <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]" asChild>
                        <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </a>
                      </Button>
                    ) : undefined
                  }
                />
                </motion.div>
              ))}
            </div>
            {loadingMore && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ContentCardSkeleton key={i} />
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
              loadedCount={items.length}
              total={total}
              label="syllabus entries"
            />
          </>
        )}
      </motion.div>
    </div>
  )
}
