"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { Search, AlertCircle, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { JobCard, JobCardSkeleton } from "@/components/home/JobCard"
import {
  useInfiniteScroll,
  appendUnique,
  PUBLIC_INFINITE_LIMIT as LIMIT,
} from "@/hooks/useInfiniteScroll"
import { InfiniteListFooter } from "@/components/ui/infinite-list-footer"

interface CategoryInfo {
  id: string
  name: string
  slug: string
  jobCount: number
}

interface JobData {
  id: string
  title: string
  slug: string
  department: { id: string; name: string; slug: string }
  category: { id: string; name: string; slug: string }
  state: { id: string; name: string; slug: string } | null
  location: string | null
  totalVacancies: number | null
  lastDate: string | null
  salary: string | null
  status: "ACTIVE" | "EXPIRED" | "UPCOMING"
}

export function CategoryClient({ category }: { category: CategoryInfo }) {
  const [jobs, setJobs] = useState<JobData[]>([])
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
      params.set("categoryId", category.id)
      if (debouncedSearch) params.set("search", debouncedSearch)
      params.set("page", String(pageNum))
      params.set("limit", String(LIMIT))

      const res = await fetch(`/api/jobs?${params}`, { signal })
      const json = await res.json()
      if (signal.aborted) return
      if (json.success) {
        setJobs((prev) => (replace ? json.data : appendUnique(prev, json.data)))
        setTotal(json.pagination.total ?? 0)
        setHasMore(pageNum < (json.pagination.totalPages ?? 1))
        pageRef.current = pageNum
      } else if (replace) {
        setError(json.error || "Failed to fetch jobs")
      } else {
        setLoadMoreError(json.error || "Failed to load more. Please retry.")
      }
    } catch {
      if (signal.aborted) return
      if (replace) setError("Failed to fetch jobs. Please try again.")
      else setLoadMoreError("Failed to load more. Please retry.")
    } finally {
      if (!signal.aborted) {
        if (replace) setLoading(false)
        else setLoadingMore(false)
      }
    }
  }, [debouncedSearch, category.id])

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
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Jobs
            </Link>
          </Button>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">{category.name} Jobs</h1>
          <p className="text-gray-600">
            {category.jobCount} job{category.jobCount !== 1 ? "s" : ""} available in {category.name} category
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search jobs..."
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
              <JobCardSkeleton key={i} />
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
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <Search className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No jobs found</h3>
              <p className="mb-4 text-sm text-gray-500">
                {search ? "Try adjusting your search." : `No ${category.name} jobs available right now. Check back later.`}
              </p>
              {search && (
                <Button variant="outline" onClick={() => { setSearch("") }}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Showing {jobs.length} of {total} jobs
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35 }}
                >
                  <JobCard
                    id={job.id}
                    title={job.title}
                    department={job.department.name}
                    departmentSlug={job.department.slug}
                    location={job.location || job.state?.name}
                    totalVacancies={job.totalVacancies}
                    lastDateToApply={job.lastDate}
                    salary={job.salary}
                    status={job.status}
                    slug={job.slug}
                  />
                </motion.div>
              ))}
            </div>
            {loadingMore && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <JobCardSkeleton key={i} />
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
              loadedCount={jobs.length}
              total={total}
              label="jobs"
            />
          </>
        )}
      </motion.div>
    </div>
  )
}
