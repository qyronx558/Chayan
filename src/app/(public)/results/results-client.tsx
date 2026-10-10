"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Search, AlertCircle, Calendar, Download, FileCheck2, X } from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { SectionHero } from "@/components/layout/SectionHero"
import { ContentCard, ContentCardSkeleton } from "@/components/ui/content-card"
import { formatDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { usePublicPageSize } from "@/lib/admin/usePageSize"
import { PageSizeSelect } from "@/components/admin/data-table/PageSizeSelect"

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

interface PaginationData {
  page: number
  total: number
  totalPages: number
}

export function ResultsClient() {
  const [results, setResults] = useState<ResultData[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const { pageSize, setPageSize, options } = usePublicPageSize("results")

  const fetchResults = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      params.set("page", String(page))
      params.set("limit", String(pageSize))

      const res = await fetch(`/api/results?${params}`)
      const json = await res.json()
      if (json.success) {
        setResults(json.data)
        setPagination(json.pagination)
      } else {
        setError(json.error || "Failed to fetch results")
      }
    } catch {
      setError("Failed to fetch results. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [search, page, pageSize])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SectionHero
          icon={FileCheck2}
          badge="Results"
          title="Exam Results"
          subtitle="Download the latest government exam result PDFs and check your outcome in one place."
          count={pagination?.total}
        />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search results..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-10 pr-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
{loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: Math.min(pageSize, 12) }).map((_, i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Something went wrong</h3>
              <p className="mb-4 text-sm text-gray-500">{error}</p>
              <Button onClick={() => fetchResults()}>Try Again</Button>
            </CardContent>
          </Card>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <Search className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No results found</h3>
              <p className="text-sm text-gray-500">
                Try adjusting your search or check back later for new results.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Showing {results.length} of {pagination?.total ?? 0} results
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ContentCard
                  icon={FileCheck2}
                  iconClassName="from-emerald-600 to-teal-800"
                  badge={<Badge variant="secondary" className="max-w-[65%] truncate bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{result.department.name}</Badge>}
                  statusBadge={<span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Result</span>}
                  title={result.title}
                  description={result.description}
                  meta={result.resultDate ? [{ icon: Calendar, text: formatDate(result.resultDate) }] : []}
                  href={`/result/${result.slug}`}
                  ctaLabel="View Result"
                  footer={
                    <div className="flex items-center gap-1">
                      <BookmarkButton resultId={result.id} />
                      {result.pdfUrl && (
                        <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]" asChild>
                          <a href={result.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3.5 w-3.5" />
                            PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  }
                />
                </motion.div>
              ))}
            </div>
            {pagination && pagination.total > options[0] && (
              <div className="mt-8 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <div className="flex flex-1 justify-center">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={setPage}
                  />
                </div>
                <PageSizeSelect value={pageSize} options={options} onChange={(n) => { setPageSize(n); setPage(1) }} />
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
