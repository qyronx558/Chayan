"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { JobCard, JobCardSkeleton } from "@/components/home/JobCard"
import { UniversalCardEmpty } from "@/components/ui/universal-card"
import { listGridWithSidebar } from "@/components/ui/module-theme"
import { filterValidItems } from "@/lib/card-helpers"
import { ListingFilters } from "@/components/listing/ListingFilters"
import { ListingLayout } from "@/components/listing/ListingLayout"
import { ListingToolbar } from "@/components/listing/ListingToolbar"
import type { ActiveFilterChip, FilterControl, QuickFilter, SortOption } from "@/components/listing/types"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useFilterOptions } from "@/hooks/useFilterOptions"
import { useInfiniteListing } from "@/hooks/useInfiniteListing"
import { useListingQuerySync } from "@/hooks/useListingQuerySync"
import { InfiniteListFooter } from "@/components/ui/infinite-list-footer"

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

const SORT_OPTIONS: SortOption[] = [
  { value: "latest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "last_date_asc", label: "Closing soon" },
  { value: "last_date_desc", label: "Closing last" },
  { value: "name_asc", label: "Name A–Z" },
]

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "EXPIRED", label: "Expired" },
]

const POSTED_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
]

export function JobsClient() {
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoryId") ?? "")
  const [selectedDepartment, setSelectedDepartment] = useState(searchParams.get("departmentId") ?? "")
  const [selectedState, setSelectedState] = useState(searchParams.get("stateId") ?? "")
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") ?? "")
  const [qualification, setQualification] = useState(searchParams.get("qualification") ?? "")
  const [minVacancies, setMinVacancies] = useState(searchParams.get("minVacancies") ?? "")
  const [lastDateFrom, setLastDateFrom] = useState(searchParams.get("fromDate") ?? "")
  const [lastDateTo, setLastDateTo] = useState(searchParams.get("toDate") ?? "")
  const [postedWithin, setPostedWithin] = useState(searchParams.get("postedWithin") ?? "")
  const [closingSoon, setClosingSoon] = useState(searchParams.get("closingSoon") === "1")
  const [hasApplyLink, setHasApplyLink] = useState(searchParams.get("hasApplyLink") === "1")
  const [sort, setSort] = useState(searchParams.get("sort") ?? "latest")

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const debouncedQualification = useDebouncedValue(qualification.trim(), 300)

  const { categories, departments, states } = useFilterOptions({ includeStates: true })

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      categoryId: selectedCategory,
      departmentId: selectedDepartment,
      stateId: selectedState,
      status: selectedStatus,
      qualification: debouncedQualification,
      minVacancies: minVacancies ? Number(minVacancies) : "",
      fromDate: lastDateFrom,
      toDate: lastDateTo,
      postedWithin,
      closingSoon: closingSoon ? "1" : "",
      hasApplyLink: hasApplyLink ? "1" : "",
      sort,
    }),
    [
      debouncedSearch,
      selectedCategory,
      selectedDepartment,
      selectedState,
      selectedStatus,
      debouncedQualification,
      minVacancies,
      lastDateFrom,
      lastDateTo,
      postedWithin,
      closingSoon,
      hasApplyLink,
      sort,
    ]
  )

  const {
    items: jobs,
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
  } = useInfiniteListing<JobData>({ endpoint: "/api/jobs", params })

  useListingQuerySync({
    search: debouncedSearch,
    categoryId: selectedCategory,
    departmentId: selectedDepartment,
    stateId: selectedState,
    status: selectedStatus,
    qualification: debouncedQualification,
    minVacancies,
    fromDate: lastDateFrom,
    toDate: lastDateTo,
    postedWithin,
    closingSoon: closingSoon ? "1" : "",
    hasApplyLink: hasApplyLink ? "1" : "",
    sort,
  })

  const clearFilters = () => {
    setSearch("")
    setSelectedCategory("")
    setSelectedDepartment("")
    setSelectedState("")
    setSelectedStatus("")
    setQualification("")
    setMinVacancies("")
    setLastDateFrom("")
    setLastDateTo("")
    setPostedWithin("")
    setClosingSoon(false)
    setHasApplyLink(false)
    setSort("latest")
  }

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      selectedCategory ||
      selectedDepartment ||
      selectedState ||
      selectedStatus ||
      debouncedQualification ||
      minVacancies ||
      lastDateFrom ||
      lastDateTo ||
      postedWithin ||
      closingSoon ||
      hasApplyLink
  )

  const activeCount = [
    debouncedSearch,
    selectedCategory,
    selectedDepartment,
    selectedState,
    selectedStatus,
    debouncedQualification,
    minVacancies,
    lastDateFrom || lastDateTo,
    postedWithin,
    closingSoon,
    hasApplyLink,
  ].filter(Boolean).length

  const categoryName = categories.find((item) => item.id === selectedCategory)?.name
  const departmentName = departments.find((item) => item.id === selectedDepartment)?.name
  const stateName = states.find((item) => item.id === selectedState)?.name
  const statusName = STATUS_OPTIONS.find((item) => item.value === selectedStatus)?.label
  const postedName = POSTED_OPTIONS.find((item) => item.value === postedWithin)?.label

  const activeFilters: ActiveFilterChip[] = []
  if (debouncedSearch) activeFilters.push({ id: "search", label: `Search: ${debouncedSearch}`, onRemove: () => setSearch("") })
  if (categoryName) activeFilters.push({ id: "category", label: categoryName, onRemove: () => setSelectedCategory("") })
  if (departmentName) activeFilters.push({ id: "department", label: departmentName, onRemove: () => setSelectedDepartment("") })
  if (stateName) activeFilters.push({ id: "state", label: stateName, onRemove: () => setSelectedState("") })
  if (selectedStatus) activeFilters.push({ id: "status", label: statusName ?? selectedStatus, onRemove: () => setSelectedStatus("") })
  if (debouncedQualification) activeFilters.push({ id: "qualification", label: `Qualification: ${debouncedQualification}`, onRemove: () => setQualification("") })
  if (minVacancies) activeFilters.push({ id: "vacancies", label: `${minVacancies}+ vacancies`, onRemove: () => setMinVacancies("") })
  if (lastDateFrom || lastDateTo) {
    activeFilters.push({
      id: "lastDate",
      label: `Last date: ${lastDateFrom || "any"} → ${lastDateTo || "any"}`,
      onRemove: () => {
        setLastDateFrom("")
        setLastDateTo("")
      },
    })
  }
  if (postedWithin) activeFilters.push({ id: "posted", label: postedName ?? `Posted within ${postedWithin}d`, onRemove: () => setPostedWithin("") })
  if (closingSoon) activeFilters.push({ id: "closing", label: "Closing in 7 days", onRemove: () => setClosingSoon(false) })
  if (hasApplyLink) activeFilters.push({ id: "applyLink", label: "Has apply link", onRemove: () => setHasApplyLink(false) })

  const quickFilters: QuickFilter[] = [
    { id: "closing", label: "Closing soon", active: closingSoon, onToggle: () => setClosingSoon((value) => !value) },
    { id: "posted", label: "Posted this week", active: postedWithin === "7", onToggle: () => setPostedWithin((value) => (value === "7" ? "" : "7")) },
    { id: "active", label: "Active only", active: selectedStatus === "ACTIVE", onToggle: () => setSelectedStatus((value) => (value === "ACTIVE" ? "" : "ACTIVE")) },
  ]

  const filters: FilterControl[] = [
    {
      kind: "searchable",
      id: "category",
      label: "Category",
      allLabel: "All Categories",
      searchPlaceholder: "Search categories…",
      options: categories,
      value: selectedCategory,
      onChange: setSelectedCategory,
    },
    {
      kind: "searchable",
      id: "department",
      label: "Department",
      allLabel: "All Departments",
      searchPlaceholder: "Search departments…",
      options: departments,
      value: selectedDepartment,
      onChange: setSelectedDepartment,
    },
    {
      kind: "searchable",
      id: "state",
      label: "State",
      allLabel: "All States",
      searchPlaceholder: "Search states…",
      options: states,
      value: selectedState,
      onChange: setSelectedState,
    },
    { kind: "select", id: "status", label: "Status", value: selectedStatus, options: STATUS_OPTIONS, onChange: setSelectedStatus },
    {
      kind: "text",
      id: "qualification",
      label: "Qualification",
      placeholder: "e.g. Graduate, B.Tech",
      value: qualification,
      onChange: setQualification,
    },
    { kind: "number", id: "minVacancies", label: "Minimum vacancies", placeholder: "e.g. 100", min: 0, value: minVacancies, onChange: setMinVacancies },
    { kind: "dateRange", id: "lastDate", label: "Last date", from: lastDateFrom, to: lastDateTo, onChange: (from, to) => { setLastDateFrom(from); setLastDateTo(to) } },
    { kind: "select", id: "postedWithin", label: "Posted", value: postedWithin, options: POSTED_OPTIONS, onChange: setPostedWithin },
    { kind: "toggle", id: "applyLink", label: "Has apply link", description: "Only jobs with a direct apply link", checked: hasApplyLink, onChange: setHasApplyLink },
  ]

  const visibleJobs = filterValidItems(jobs)

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="mb-2 text-3xl font-bold text-foreground">Latest Government Jobs</h1>
        <p className="mb-8 text-muted-foreground">
          Browse and apply to the latest government job notifications across India.
        </p>

        <ListingLayout
          filters={
            <ListingFilters
              search={search}
              onSearchChange={setSearch}
              onSearchSubmit={() => setSearch((value) => value.trim())}
              searchPlaceholder="Search jobs, departments, qualifications…"
              filters={filters}
              quickFilters={quickFilters}
              onClear={clearFilters}
              hasActiveFilters={hasActiveFilters}
              activeCount={activeCount}
            />
          }
        >
          <ListingToolbar
            count={visibleJobs.length}
            total={total}
            label="jobs"
            refreshing={refreshing}
            sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
            activeFilters={activeFilters}
            onClearAll={clearFilters}
          />

          {loading && jobs.length === 0 ? (
            <div className={listGridWithSidebar}>
              {Array.from({ length: 9 }).map((_, index) => (
                <JobCardSkeleton key={index} />
              ))}
            </div>
          ) : error && jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <AlertCircle className="mb-4 h-12 w-12 text-brick" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">Something went wrong</h3>
                <p className="mb-4 text-sm text-muted-foreground">{error}</p>
                <Button onClick={retry}>Try Again</Button>
              </CardContent>
            </Card>
          ) : visibleJobs.length === 0 ? (
            <UniversalCardEmpty
              title="No jobs found"
              hint="Try adjusting your search or filter criteria."
              action={hasActiveFilters ? <Button variant="outline" onClick={clearFilters}>Clear Filters</Button> : undefined}
            />
          ) : (
            <>
              <div className={listGridWithSidebar}>
                {visibleJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.35 }}
                    className="h-full"
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
              {loadingMore ? (
                <div className={`mt-6 ${listGridWithSidebar}`}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <JobCardSkeleton key={index} />
                  ))}
                </div>
              ) : null}
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
        </ListingLayout>
      </motion.div>
    </div>
  )
}
