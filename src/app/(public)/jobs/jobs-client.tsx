"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, ArrowRight, MapPin } from "lucide-react"
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
import { useDistricts } from "@/hooks/useDistricts"
import { districtPagePath, jobLocationLabel, statePagePath } from "@/lib/locations"

/** Quick links in the "Find jobs in your state" banner (most-searched states). */
const POPULAR_STATES = [
  { slug: "uttar-pradesh", name: "Uttar Pradesh" },
  { slug: "bihar", name: "Bihar" },
  { slug: "rajasthan", name: "Rajasthan" },
  { slug: "maharashtra", name: "Maharashtra" },
  { slug: "madhya-pradesh", name: "Madhya Pradesh" },
  { slug: "andhra-pradesh", name: "Andhra Pradesh" },
]

interface JobData {
  id: string
  title: string
  slug: string
  department: { id: string; name: string; slug: string }
  category: { id: string; name: string; slug: string }
  jobLevel?: "CENTRAL" | "STATE" | "DISTRICT"
  state: { id: string; name: string; slug: string } | null
  district?: { id: string; name: string; slug: string } | null
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

const LEVEL_OPTIONS = [
  { value: "", label: "All levels" },
  { value: "central", label: "Central (All India)" },
  { value: "state", label: "State" },
  { value: "district", label: "District" },
]

const LEVEL_LABEL: Record<string, string> = { central: "Central jobs", state: "State jobs", district: "District jobs" }

/**
 * Locks the listing to "everything a resident of this state/district can apply for"
 * (used by /jobs/state/[state] and /jobs/district/[state]/[district]).
 */
export interface JobsPreset {
  eligibleState: string
  eligibleDistrict?: string
  heading: string
  intro: string
}

export function JobsClient({ preset }: { preset?: JobsPreset } = {}) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoryId") ?? "")
  const [selectedDepartment, setSelectedDepartment] = useState(searchParams.get("departmentId") ?? "")
  // Legacy links (/jobs?stateId=<id>) keep working; new filters use slugs for SEO.
  const [selectedState, setSelectedState] = useState(searchParams.get("stateId") ?? "")
  const [level, setLevelRaw] = useState(() => {
    const raw = (searchParams.get("level") ?? "").toLowerCase()
    return ["central", "state", "district"].includes(raw) ? raw : ""
  })
  const [stateSlug, setStateSlugRaw] = useState(searchParams.get("state") ?? "")
  const [districtSlug, setDistrictSlugRaw] = useState(searchParams.get("district") ?? "")
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
  const { districts, loading: districtsLoading } = useDistricts(preset ? preset.eligibleState : stateSlug)

  // Parent changes clear their children: level → state → district.
  // Central jobs have no state/district, so "Central" clears them, and picking a
  // state/district while on "Central" widens the level back to "All".
  // A district only makes sense for district-level jobs.
  const setLevel = (next: string) => {
    setLevelRaw(next)
    if (next === "central") {
      setStateSlugRaw("")
      setDistrictSlugRaw("")
    }
    if (next === "state") setDistrictSlugRaw("")
  }
  const setStateSlug = (next: string) => {
    setStateSlugRaw(next)
    setDistrictSlugRaw("")
    if (next && level === "central") setLevelRaw("")
  }
  const setDistrictSlug = (next: string) => {
    setDistrictSlugRaw(next)
    if (next && (level === "central" || level === "state")) setLevelRaw("")
  }

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      categoryId: selectedCategory,
      departmentId: selectedDepartment,
      stateId: selectedState,
      level: preset ? "" : level,
      state: preset ? "" : stateSlug,
      district: preset ? "" : districtSlug,
      eligibleState: preset?.eligibleState ?? "",
      eligibleDistrict: preset?.eligibleDistrict ?? "",
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
      level,
      stateSlug,
      districtSlug,
      preset,
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
    level: preset ? undefined : level,
    state: preset ? undefined : stateSlug,
    district: preset ? undefined : districtSlug,
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
    setLevel("")
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
      (!preset && level) ||
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
    !preset && level,
    !preset && stateSlug,
    !preset && districtSlug,
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
  if (stateName) activeFilters.push({ id: "stateId", label: stateName, onRemove: () => setSelectedState("") })
  if (!preset && level) activeFilters.push({ id: "level", label: LEVEL_LABEL[level] ?? level, onRemove: () => setLevel("") })
  if (!preset && stateSlug) {
    const name = states.find((s) => s.slug === stateSlug)?.name ?? stateSlug
    activeFilters.push({ id: "state", label: name, onRemove: () => setStateSlug("") })
  }
  if (!preset && districtSlug) {
    const name = districts.find((d) => d.slug === districtSlug)?.name ?? districtSlug
    activeFilters.push({ id: "district", label: name, onRemove: () => setDistrictSlug("") })
  }
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

  const stateOptions = states.filter((s) => s.slug).map((s) => ({ id: s.slug as string, name: s.name }))
  // State / district SEO pages: the location dropdowns navigate between those
  // pages (keeping sort & other filters) instead of filtering in place.
  const goTo = (path: string) => router.push(`${path}${typeof window !== "undefined" ? window.location.search : ""}`)
  const locationFilters: FilterControl[] = preset
    ? [
        {
          kind: "searchable",
          id: "state",
          label: "State / UT",
          allLabel: "All states",
          searchPlaceholder: "Search states…",
          options: stateOptions,
          value: preset.eligibleState,
          onChange: (slug) => goTo(slug ? statePagePath(slug) : "/jobs/states"),
        },
        {
          kind: "searchable",
          id: "district",
          label: "District",
          allLabel: districtsLoading ? "Loading districts…" : "All districts",
          searchPlaceholder: "Search districts…",
          // Only the districts of this page's state.
          options: districts.map((d) => ({ id: d.slug, name: d.name })),
          value: preset.eligibleDistrict ?? "",
          onChange: (slug) =>
            goTo(slug ? districtPagePath(preset.eligibleState, slug) : statePagePath(preset.eligibleState)),
        },
      ]
    : [
        { kind: "select", id: "level", label: "Job level", value: level, options: LEVEL_OPTIONS, onChange: setLevel },
        {
          kind: "searchable",
          id: "state",
          label: "State / UT",
          allLabel: "All states",
          searchPlaceholder: "Search states…",
          options: stateOptions,
          value: stateSlug,
          onChange: setStateSlug,
        },
        {
          kind: "searchable",
          id: "district",
          label: "District",
          allLabel: !stateSlug ? "Select a state first" : districtsLoading ? "Loading districts…" : "All districts",
          searchPlaceholder: "Search districts…",
          // Only the districts of the selected state.
          options: districts.map((d) => ({ id: d.slug, name: d.name })),
          value: districtSlug,
          onChange: setDistrictSlug,
          disabled: !stateSlug,
        },
      ]

  const filters: FilterControl[] = [
    ...locationFilters,
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
        {preset ? (
          <>
            <h1 className="mb-2 text-3xl font-bold text-foreground">{preset.heading}</h1>
            <p className="mb-8 text-muted-foreground">{preset.intro}</p>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-3xl font-bold text-foreground">Latest Government Jobs</h1>
            <p className="mb-6 text-muted-foreground">
              Browse and apply to the latest government job notifications across India.
            </p>
            <section
              aria-labelledby="browse-by-state"
              className="mb-8 flex flex-col gap-4 rounded-2xl border border-rule border-l-4 border-l-brick bg-paper-2 p-5 dark:border-ink dark:border-l-brick sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brick text-brick-ink" aria-hidden>
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 id="browse-by-state" className="text-lg font-semibold text-foreground">
                    Find jobs in your state &amp; district
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    28 states, 8 union territories and 780+ districts: see state jobs, local district vacancies and all-India jobs in one place.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {POPULAR_STATES.map((s) => (
                      <Link
                        key={s.slug}
                        href={statePagePath(s.slug)}
                        className="rounded-full border border-rule bg-background px-2.5 py-0.5 text-xs text-foreground transition-colors hover:border-brick hover:text-brick dark:border-ink"
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <Button asChild size="lg" className="shrink-0">
                <Link href="/jobs/states">
                  Browse jobs by state <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </section>
          </>
        )}

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
                      locationLabel={jobLocationLabel(job)}
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
