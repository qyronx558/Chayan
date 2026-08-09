"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Search, AlertCircle, Download, Book, X, BookOpen } from "lucide-react"
import { SectionHero } from "@/components/layout/SectionHero"
import { ContentCard, ContentCardSkeleton } from "@/components/ui/content-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"

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

interface PaginationData {
  page: number
  total: number
  totalPages: number
}

export function SyllabusClient() {
  const [items, setItems] = useState<SyllabusData[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchItems = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      params.set("page", String(page))
      params.set("limit", "12")

      const res = await fetch(`/api/syllabus?${params}`, { signal })
      const json = await res.json()
      if (json.success) {
        setItems(json.data)
        setPagination(json.pagination)
      } else {
        setError(json.error || "Failed to fetch syllabus")
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError("Failed to fetch syllabus. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    const controller = new AbortController()
    fetchItems(controller.signal)
    return () => controller.abort()
  }, [fetchItems])

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
          count={pagination?.total}
        />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search syllabus..."
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
            {Array.from({ length: 6 }).map((_, i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Something went wrong</h3>
              <p className="mb-4 text-sm text-gray-500">{error}</p>
              <Button onClick={() => fetchItems()}>Try Again</Button>
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
              Showing {items.length} of {pagination?.total ?? 0} syllabus entries
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
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
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
