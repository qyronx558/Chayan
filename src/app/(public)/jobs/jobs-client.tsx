"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import { Search, AlertCircle, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { JobCard, JobCardSkeleton } from "@/components/home/JobCard"
import { SearchableFilter } from "@/components/jobs/SearchableFilter"
import { usePublicPageSize } from "@/lib/admin/usePageSize"
import { PageSizeSelect } from "@/components/admin/data-table/PageSizeSelect"

interface FilterOption {
  id: string
  name: string
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

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function JobsClient() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState<JobData[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") ?? "")
  const [page, setPage] = useState(1)
  const { pageSize, setPageSize, options } = usePublicPageSize("jobs")

  const [categories, setCategories] = useState<FilterOption[]>([])
  const [departments, setDepartments] = useState<FilterOption[]>([])
  const [states, setStates] = useState<FilterOption[]>([])

  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")

  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
      fetch("/api/states").then((r) => r.json()),
    ])
      .then(([catRes, depRes, stateRes]) => {
        if (catRes.success) setCategories(catRes.data)
        if (depRes.success) setDepartments(depRes.data)
        if (stateRes.success) setStates(stateRes.data)
      })
      .catch(() => {})
  }, [])

  const fetchJobs = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (selectedCategory) params.set("categoryId", selectedCategory)
      if (selectedDepartment) params.set("departmentId", selectedDepartment)
      if (selectedState) params.set("stateId", selectedState)
      if (selectedStatus) params.set("status", selectedStatus)
      params.set("page", String(page))
      params.set("limit", String(pageSize))

      const res = await fetch(`/api/jobs?${params}`, { signal })
      const json = await res.json()
      if (json.success) {
        setJobs(json.data)
        setPagination(json.pagination)
      } else {
        setError(json.error || "Failed to fetch jobs")
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError("Failed to fetch jobs. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, selectedCategory, selectedDepartment, selectedState, selectedStatus, page, pageSize])

  useEffect(() => {
    const controller = new AbortController()
    fetchJobs(controller.signal)
    return () => controller.abort()
  }, [fetchJobs])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setDebouncedSearch(search)
  }

  const clearFilters = () => {
    setSelectedCategory("")
    setSelectedDepartment("")
    setSelectedState("")
    setSelectedStatus("")
    setSearch("")
    setDebouncedSearch("")
    setPage(1)
  }

  const hasActiveFilters = selectedCategory || selectedDepartment || selectedState || selectedStatus || debouncedSearch

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Latest Government Jobs</h1>
        <p className="mb-8 text-gray-600">
          Browse and apply to the latest government job notifications across India.
        </p>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          </form>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className={`mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${showFilters ? "grid" : "hidden lg:grid"}`}>
          <SearchableFilter
            value={selectedCategory}
            options={categories}
            allLabel="All Categories"
            searchPlaceholder="Search categories..."
            onChange={(v) => { setSelectedCategory(v); setPage(1) }}
          />
          <SearchableFilter
            value={selectedDepartment}
            options={departments}
            allLabel="All Departments"
            searchPlaceholder="Search departments..."
            onChange={(v) => { setSelectedDepartment(v); setPage(1) }}
          />
          <SearchableFilter
            value={selectedState}
            options={states}
            allLabel="All States"
            searchPlaceholder="Search states..."
            onChange={(v) => { setSelectedState(v); setPage(1) }}
          />
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1) }}
            className="h-10 w-full min-w-0 truncate rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="UPCOMING">Upcoming</option>
          </select>
        </div>
{loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: Math.min(pageSize, 12) }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">Something went wrong</h3>
              <p className="mb-4 text-sm text-gray-500">{error}</p>
              <Button onClick={() => fetchJobs()}>Try Again</Button>
            </CardContent>
          </Card>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16">
              <Search className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No jobs found</h3>
              <p className="mb-4 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
              {hasActiveFilters && <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-500">
              Showing {jobs.length} of {pagination?.total ?? 0} jobs
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
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
