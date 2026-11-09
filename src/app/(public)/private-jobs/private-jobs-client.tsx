"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { AlertCircle, Flag, Sparkles, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UniversalCardSkeleton, UniversalCardEmpty } from "@/components/ui/universal-card"
import { listGridWithSidebar } from "@/components/ui/module-theme"
import { filterValidItems } from "@/lib/card-helpers"
import { PrivateJobCard } from "@/components/private/PrivateJobCard"
import { JobRecommendations } from "@/components/jobs/JobRecommendations"
import { ListingFilters } from "@/components/listing/ListingFilters"
import { ListingLayout } from "@/components/listing/ListingLayout"
import { ListingToolbar } from "@/components/listing/ListingToolbar"
import type { ActiveFilterChip, FilterControl, FilterOption, QuickFilter, SortOption } from "@/components/listing/types"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useInfiniteListing } from "@/hooks/useInfiniteListing"
import { useListingQuerySync } from "@/hooks/useListingQuerySync"
import { InfiniteListFooter } from "@/components/ui/infinite-list-footer"

interface Company {
  id: string
  name: string
  logo?: string | null
  verifiedStatus?: string
}

interface PrivateJobData {
  id: string
  title: string
  slug: string
  type: string
  category?: string | null
  description?: string | null
  location?: string | null
  salary?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  experience?: string | null
  applicationUrl?: string | null
  applicationEmail?: string | null
  lastDate?: string | null
  status: string
  remotePolicy?: string | null
  isFresherFriendly?: boolean
  isWalkIn?: boolean
  skills?: string[]
  trustScore?: number
  views?: number
  company: Company
  createdAt: string
}

interface PrivateFilters {
  companies: Company[]
  locations: string[]
  types: string[]
  remotes: string[]
  skills: string[]
  categories: string[]
}

interface PrivateJobsPreset {
  remote?: string
  fresher?: string
  walkin?: string
}

const typeLabels: Record<string, string> = {
  FULL_TIME: "Full-Time",
  PART_TIME: "Part-Time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
}

const SORT_OPTIONS: SortOption[] = [
  { value: "new", label: "Newest" },
  { value: "trust", label: "Most trusted" },
  { value: "salary", label: "Highest salary" },
  { value: "trending", label: "Trending" },
]

const REMOTE_OPTIONS = [
  { value: "", label: "All modes" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ONSITE", label: "On-site" },
]

const EXPERIENCE_OPTIONS = [
  { value: "", label: "Any experience" },
  { value: "0", label: "Fresher (0 yrs)" },
  { value: "1", label: "1+ years" },
  { value: "2", label: "2+ years" },
  { value: "3", label: "3+ years" },
  { value: "5", label: "5+ years" },
]

const POSTED_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
]

const STATUS_OPTIONS = [
  { value: "", label: "All status" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRED", label: "Expired" },
]

export function PrivateJobsClient({ preset = {} }: { preset?: PrivateJobsPreset }) {
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") ?? "")
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") ?? "")
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("companyId") ?? "")
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") ?? "")
  const [remoteFilter, setRemoteFilter] = useState(searchParams.get("remote") ?? preset.remote ?? "")
  const [skillFilter, setSkillFilter] = useState(searchParams.get("skill") ?? "")
  const [expFilter, setExpFilter] = useState(searchParams.get("exp") ?? "")
  const [minSalary, setMinSalary] = useState(searchParams.get("minSalary") ?? "")
  const [minVacancies, setMinVacancies] = useState(searchParams.get("minVacancies") ?? "")
  const [qualification, setQualification] = useState(searchParams.get("qualification") ?? "")
  const [postedWithin, setPostedWithin] = useState(searchParams.get("postedWithin") ?? "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "")
  const [sort, setSort] = useState(searchParams.get("sort") ?? "new")
  const [fresherOnly, setFresherOnly] = useState(
    searchParams.get("fresher") === "1" || preset.fresher === "1"
  )
  const [walkinOnly, setWalkinOnly] = useState(
    searchParams.get("walkin") === "1" || preset.walkin === "1"
  )

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const debouncedQualification = useDebouncedValue(qualification.trim(), 300)

  const [filterData, setFilterData] = useState<PrivateFilters>({
    companies: [],
    locations: [],
    types: [],
    remotes: [],
    skills: [],
    categories: [],
  })

  useEffect(() => {
    fetch("/api/private-jobs/filters")
      .then((response) => response.json())
      .then((json) => {
        if (json.success) {
          setFilterData({
            companies: json.data.companies ?? [],
            locations: json.data.locations ?? [],
            types: json.data.types ?? [],
            remotes: json.data.remotes ?? [],
            skills: json.data.skills ?? [],
            categories: json.data.categories ?? [],
          })
        }
      })
      .catch(() => {})
  }, [])

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      category: categoryFilter,
      type: typeFilter,
      companyId: companyFilter,
      location: locationFilter,
      remote: remoteFilter,
      skill: skillFilter,
      exp: expFilter,
      minSalary: minSalary ? Number(minSalary) : "",
      minVacancies: minVacancies ? Number(minVacancies) : "",
      qualification: debouncedQualification,
      postedWithin,
      status: statusFilter,
      fresher: fresherOnly ? "1" : "",
      walkin: walkinOnly ? "1" : "",
      sort,
    }),
    [
      debouncedSearch,
      categoryFilter,
      typeFilter,
      companyFilter,
      locationFilter,
      remoteFilter,
      skillFilter,
      expFilter,
      minSalary,
      minVacancies,
      debouncedQualification,
      postedWithin,
      statusFilter,
      fresherOnly,
      walkinOnly,
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
  } = useInfiniteListing<PrivateJobData>({ endpoint: "/api/private-jobs", params })

  useListingQuerySync({
    search: debouncedSearch,
    category: categoryFilter,
    type: typeFilter,
    companyId: companyFilter,
    location: locationFilter,
    remote: remoteFilter,
    skill: skillFilter,
    exp: expFilter,
    minSalary,
    minVacancies,
    qualification: debouncedQualification,
    postedWithin,
    status: statusFilter,
    fresher: fresherOnly ? "1" : "",
    walkin: walkinOnly ? "1" : "",
    sort,
  })

  const clearFilters = () => {
    setSearch("")
    setCategoryFilter("")
    setTypeFilter("")
    setCompanyFilter("")
    setLocationFilter("")
    setRemoteFilter("")
    setSkillFilter("")
    setExpFilter("")
    setMinSalary("")
    setMinVacancies("")
    setQualification("")
    setPostedWithin("")
    setStatusFilter("")
    setSort("new")
    setFresherOnly(false)
    setWalkinOnly(false)
  }

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      categoryFilter ||
      typeFilter ||
      companyFilter ||
      locationFilter ||
      remoteFilter ||
      skillFilter ||
      expFilter ||
      minSalary ||
      minVacancies ||
      debouncedQualification ||
      postedWithin ||
      statusFilter ||
      fresherOnly ||
      walkinOnly ||
      sort !== "new"
  )

  const activeCount = [
    debouncedSearch,
    categoryFilter,
    typeFilter,
    companyFilter,
    locationFilter,
    remoteFilter,
    skillFilter,
    expFilter,
    minSalary,
    minVacancies,
    debouncedQualification,
    postedWithin,
    statusFilter,
    fresherOnly,
    walkinOnly,
  ].filter(Boolean).length

  const companyOptions: FilterOption[] = filterData.companies.map((company) => ({ id: company.id, name: company.name }))
  const locationOptions: FilterOption[] = filterData.locations.map((location) => ({ id: location, name: location }))
  const skillOptions: FilterOption[] = filterData.skills.map((skill) => ({ id: skill, name: skill }))
  const categoryOptions: FilterOption[] = filterData.categories.map((category) => ({ id: category, name: category }))

  const typeOptions = [
    { value: "", label: "All types" },
    ...filterData.types.map((type) => ({ value: type, label: typeLabels[type] ?? type })),
  ]

  const remoteOptions = [
    ...REMOTE_OPTIONS,
    ...filterData.remotes
      .filter((remote) => !["REMOTE", "HYBRID", "ONSITE"].includes(remote))
      .map((remote) => ({ value: remote, label: remote })),
  ]

  const categoryName = categoryFilter || ""
  const companyName = filterData.companies.find((company) => company.id === companyFilter)?.name
  const typeName = typeLabels[typeFilter] ?? typeFilter
  const expName = EXPERIENCE_OPTIONS.find((option) => option.value === expFilter)?.label

  const activeFilters: ActiveFilterChip[] = []
  if (debouncedSearch) activeFilters.push({ id: "search", label: `Search: ${debouncedSearch}`, onRemove: () => setSearch("") })
  if (categoryFilter) activeFilters.push({ id: "category", label: categoryName, onRemove: () => setCategoryFilter("") })
  if (companyName) activeFilters.push({ id: "company", label: companyName, onRemove: () => setCompanyFilter("") })
  if (locationFilter) activeFilters.push({ id: "location", label: locationFilter, onRemove: () => setLocationFilter("") })
  if (typeFilter) activeFilters.push({ id: "type", label: typeName, onRemove: () => setTypeFilter("") })
  if (remoteFilter) activeFilters.push({ id: "remote", label: remoteFilter, onRemove: () => setRemoteFilter("") })
  if (skillFilter) activeFilters.push({ id: "skill", label: skillFilter, onRemove: () => setSkillFilter("") })
  if (expFilter) activeFilters.push({ id: "exp", label: expName ?? `${expFilter}+ years`, onRemove: () => setExpFilter("") })
  if (minSalary) activeFilters.push({ id: "salary", label: `≥ ₹${Number(minSalary).toLocaleString("en-IN")}`, onRemove: () => setMinSalary("") })
  if (minVacancies) activeFilters.push({ id: "vacancies", label: `${minVacancies}+ vacancies`, onRemove: () => setMinVacancies("") })
  if (debouncedQualification) activeFilters.push({ id: "qualification", label: `Qualification: ${debouncedQualification}`, onRemove: () => setQualification("") })
  if (postedWithin) activeFilters.push({ id: "posted", label: `Posted within ${postedWithin}d`, onRemove: () => setPostedWithin("") })
  if (statusFilter) activeFilters.push({ id: "status", label: statusFilter, onRemove: () => setStatusFilter("") })
  if (fresherOnly) activeFilters.push({ id: "fresher", label: "Freshers", onRemove: () => setFresherOnly(false) })
  if (walkinOnly) activeFilters.push({ id: "walkin", label: "Walk-in", onRemove: () => setWalkinOnly(false) })

  const quickFilters: QuickFilter[] = [
    { id: "remote", label: "Remote", active: remoteFilter === "REMOTE", onToggle: () => setRemoteFilter((value) => (value === "REMOTE" ? "" : "REMOTE")) },
    { id: "fresher", label: "Freshers", active: fresherOnly, onToggle: () => setFresherOnly((value) => !value) },
    { id: "walkin", label: "Walk-ins", active: walkinOnly, onToggle: () => setWalkinOnly((value) => !value) },
    { id: "highSalary", label: "High salary", active: minSalary === "1000000", onToggle: () => setMinSalary((value) => (value === "1000000" ? "" : "1000000")) },
  ]

  const filters: FilterControl[] = [
    { kind: "select", id: "category", label: "Category", value: categoryFilter, options: [{ value: "", label: "All categories" }, ...categoryOptions.map((option) => ({ value: option.id, label: option.name }))], onChange: setCategoryFilter },
    { kind: "searchable", id: "company", label: "Company", allLabel: "All companies", searchPlaceholder: "Search companies…", options: companyOptions, value: companyFilter, onChange: setCompanyFilter },
    { kind: "searchable", id: "location", label: "Location", allLabel: "All locations", searchPlaceholder: "Search locations…", options: locationOptions, value: locationFilter, onChange: setLocationFilter },
    { kind: "select", id: "type", label: "Job type", value: typeFilter, options: typeOptions, onChange: setTypeFilter },
    { kind: "select", id: "remote", label: "Work mode", value: remoteFilter, options: remoteOptions, onChange: setRemoteFilter },
    { kind: "searchable", id: "skill", label: "Skill", allLabel: "All skills", searchPlaceholder: "Search skills…", options: skillOptions, value: skillFilter, onChange: setSkillFilter },
    { kind: "number", id: "minSalary", label: "Minimum salary (₹)", placeholder: "e.g. 600000", min: 0, value: minSalary, onChange: setMinSalary },
    { kind: "select", id: "exp", label: "Experience", value: expFilter, options: EXPERIENCE_OPTIONS, onChange: setExpFilter },
    { kind: "select", id: "status", label: "Status", value: statusFilter, options: STATUS_OPTIONS, onChange: setStatusFilter },
    { kind: "text", id: "qualification", label: "Qualification", placeholder: "e.g. B.Tech, MBA", value: qualification, onChange: setQualification },
    { kind: "number", id: "minVacancies", label: "Minimum vacancies", placeholder: "e.g. 5", min: 0, value: minVacancies, onChange: setMinVacancies },
    { kind: "select", id: "postedWithin", label: "Posted", value: postedWithin, options: POSTED_OPTIONS, onChange: setPostedWithin },
  ]

  const visibleJobs = filterValidItems(jobs)

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-foreground">Private jobs</h1>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href="/private-jobs/remote" className="border border-rule px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick"><Wifi className="mr-1 inline h-3 w-3" />Remote</Link>
            <Link href="/private-jobs/freshers" className="border border-rule px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick"><Sparkles className="mr-1 inline h-3 w-3" />Freshers</Link>
            <Link href="/private-jobs/walkins" className="border border-rule px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick"><Flag className="mr-1 inline h-3 w-3" />Walk-ins</Link>
            <Link href="/private-jobs/refer" className="border border-rule px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick">+ Refer a job</Link>
          </div>
        </div>
        <p className="mb-8 max-w-2xl text-muted-foreground">
          Full-time, part-time, internships, and contract positions from top companies - with trust scores, tracking and prep.
        </p>

        <ListingLayout
          filters={
            <ListingFilters
              search={search}
              onSearchChange={setSearch}
              onSearchSubmit={() => setSearch((value) => value.trim())}
              searchPlaceholder="Search title, company, skill, location…"
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
            label="private jobs"
            refreshing={refreshing}
            sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
            activeFilters={activeFilters}
            onClearAll={clearFilters}
          />

          <div className="mb-6">
            <JobRecommendations />
          </div>

          {loading && jobs.length === 0 ? (
            <div className={listGridWithSidebar}>
              {Array.from({ length: 9 }).map((_, index) => (
                <UniversalCardSkeleton key={index} />
              ))}
            </div>
          ) : error && jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <AlertCircle className="mb-4 h-12 w-12 text-brick" />
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">Something went wrong</h3>
                <p className="mb-4 text-sm text-muted-foreground">{error}</p>
                <Button onClick={retry}>Try Again</Button>
              </CardContent>
            </Card>
          ) : visibleJobs.length === 0 ? (
            <UniversalCardEmpty
              title="No private jobs found"
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
                    <PrivateJobCard
                      id={job.id}
                      title={job.title}
                      slug={job.slug}
                      company={job.company.name}
                      type={job.type}
                      typeLabel={typeLabels[job.type] || job.type}
                      location={job.location}
                      remotePolicy={job.remotePolicy}
                      salary={job.salary}
                      salaryMin={job.salaryMin}
                      salaryMax={job.salaryMax}
                      experience={job.experience}
                      lastDate={job.lastDate}
                      trustScore={job.trustScore}
                      isFresherFriendly={job.isFresherFriendly}
                      isWalkIn={job.isWalkIn}
                      status={job.status}
                      variant="standard"
                    />
                  </motion.div>
                ))}
              </div>
              {loadingMore ? (
                <div className={`mt-6 ${listGridWithSidebar}`}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <UniversalCardSkeleton key={index} />
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
                loadedCount={visibleJobs.length}
                total={total}
                label="private jobs"
              />
            </>
          )}
        </ListingLayout>
      </motion.div>
    </div>
  )
}
