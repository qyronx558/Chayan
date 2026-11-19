"use client"

import { AirmailHero, AirmailJobRow, AirmailRowSkeleton, OpenedLetter, SafeLetter } from "./airmail"
import { DeskListing } from "@/components/desk/DeskKit"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { filterValidItems } from "@/lib/card-helpers"
import { PrivateJobPreview, PrivateJobPreviewEmpty } from "@/components/private/PrivateJobPreview"
import type { ListJob } from "@/components/private/job-list-utils"
import { PrivateJobsPulse, PrivateJobsTrending, type DiscoverActive, type DiscoverPick } from "@/components/private/PrivateJobsDiscover"
import { ListingToolbar } from "@/components/listing/ListingToolbar"
import type { ActiveFilterChip, FilterControl, FilterOption, QuickFilter, SortOption } from "@/components/listing/types"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useInfiniteListing } from "@/hooks/useInfiniteListing"
import { useListingQuerySync } from "@/hooks/useListingQuerySync"
import { countryName } from "@/lib/private-jobs/geo"
import { InfiniteListFooter } from "@/components/ui/infinite-list-footer"

interface Company {
  id: string
  name: string
  logo?: string | null
  verifiedStatus?: string
}

/** List rows carry everything the preview pane needs, so selecting a job costs no request. */
type PrivateJobData = ListJob

interface PrivateFilters {
  companies: Company[]
  locations: string[]
  countries: { code: string; name: string; count: number }[]
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
  { value: "", label: "Open jobs" },
  { value: "EXPIRED", label: "Expired" },
  { value: "all", label: "All status" },
]

export function PrivateJobsClient({ preset = {} }: { preset?: PrivateJobsPreset }) {
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") ?? "")
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") ?? "")
  const [companyFilter, setCompanyFilter] = useState(searchParams.get("companyId") ?? "")
  const [locationFilter, setLocationFilter] = useState(searchParams.get("location") ?? "")
  const [countryFilter, setCountryFilter] = useState(searchParams.get("country") ?? "")
  const [cityFilter, setCityFilter] = useState(searchParams.get("city") ?? "")
  const [cityOptionsData, setCityOptionsData] = useState<{ country: string; cities: { name: string; count: number }[] }>({ country: "", cities: [] })
  // Country first, then a city of that country: a new country clears the city.
  const changeCountry = (value: string) => {
    setCountryFilter(value)
    setCityFilter("")
  }
  const [remoteFilter, setRemoteFilter] = useState(searchParams.get("remote") ?? preset.remote ?? "")
  const [skillFilter, setSkillFilter] = useState(searchParams.get("skill") ?? "")
  const [expFilter, setExpFilter] = useState(searchParams.get("exp") ?? "")
  const [minSalary, setMinSalary] = useState(searchParams.get("minSalary") ?? "")
  const [minVacancies, setMinVacancies] = useState(searchParams.get("minVacancies") ?? "")
  const [qualification, setQualification] = useState(searchParams.get("qualification") ?? "")
  const [postedWithin, setPostedWithin] = useState(searchParams.get("postedWithin") ?? "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "")
  const [sort, setSort] = useState(searchParams.get("sort") ?? "new")
  // Desktop split view: the selected job lives in ?job= so it survives refresh and can be shared.
  const [selectedSlug, setSelectedSlug] = useState(searchParams.get("job") ?? "")
  const [splitView, setSplitView] = useState(false)
  const [nowMs] = useState(() => Date.now())
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
    countries: [],
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
            countries: json.data.countries ?? [],
            types: json.data.types ?? [],
            remotes: json.data.remotes ?? [],
            skills: json.data.skills ?? [],
            categories: json.data.categories ?? [],
          })
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!countryFilter) return
    let cancelled = false
    fetch(`/api/private-jobs/cities?country=${encodeURIComponent(countryFilter)}`)
      .then((response) => response.json())
      .then((json) => {
        if (!cancelled && json.success) setCityOptionsData({ country: countryFilter, cities: json.data ?? [] })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [countryFilter])

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      category: categoryFilter,
      type: typeFilter,
      companyId: companyFilter,
      location: locationFilter,
      country: countryFilter,
      city: cityFilter,
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
      countryFilter,
      cityFilter,
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
    country: countryFilter,
    city: cityFilter,
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
    job: splitView ? selectedSlug : "",
  })

  const clearFilters = () => {
    setSearch("")
    setCategoryFilter("")
    setTypeFilter("")
    setCompanyFilter("")
    setLocationFilter("")
    setCountryFilter("")
    setCityFilter("")
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
      countryFilter ||
      cityFilter ||
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
    countryFilter,
    cityFilter,
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
  const countryOptions: FilterOption[] = filterData.countries.map((c) => ({ id: c.code, name: `${c.name} (${c.count.toLocaleString("en-IN")})` }))
  const cityOptions: FilterOption[] =
    countryFilter && cityOptionsData.country === countryFilter
      ? cityOptionsData.cities.map((c) => ({ id: c.name, name: `${c.name} (${c.count.toLocaleString("en-IN")})` }))
      : []
  if (cityFilter && !cityOptions.some((o) => o.id === cityFilter)) cityOptions.unshift({ id: cityFilter, name: cityFilter })
  const countryLabel = filterData.countries.find((c) => c.code === countryFilter)?.name ?? countryName(countryFilter)
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
  if (countryFilter) activeFilters.push({ id: "country", label: countryLabel, onRemove: () => changeCountry("") })
  if (cityFilter) activeFilters.push({ id: "city", label: cityFilter, onRemove: () => setCityFilter("") })
  if (locationFilter) activeFilters.push({ id: "location", label: locationFilter, onRemove: () => setLocationFilter("") })
  if (typeFilter) activeFilters.push({ id: "type", label: typeName, onRemove: () => setTypeFilter("") })
  if (remoteFilter) activeFilters.push({ id: "remote", label: remoteFilter, onRemove: () => setRemoteFilter("") })
  if (skillFilter) activeFilters.push({ id: "skill", label: skillFilter, onRemove: () => setSkillFilter("") })
  if (expFilter) activeFilters.push({ id: "exp", label: expName ?? `${expFilter}+ years`, onRemove: () => setExpFilter("") })
  if (minSalary) activeFilters.push({ id: "salary", label: `≥ ₹${Number(minSalary).toLocaleString("en-IN")}`, onRemove: () => setMinSalary("") })
  if (minVacancies) activeFilters.push({ id: "vacancies", label: `${minVacancies}+ vacancies`, onRemove: () => setMinVacancies("") })
  if (debouncedQualification) activeFilters.push({ id: "qualification", label: `Qualification: ${debouncedQualification}`, onRemove: () => setQualification("") })
  if (postedWithin) activeFilters.push({ id: "posted", label: `Posted within ${postedWithin}d`, onRemove: () => setPostedWithin("") })
  if (statusFilter) {
    const statusLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? statusFilter
    activeFilters.push({ id: "status", label: statusLabel, onRemove: () => setStatusFilter("") })
  }
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
    { kind: "searchable", id: "country", label: "Country", allLabel: "All countries", searchPlaceholder: "Search countries…", options: countryOptions, value: countryFilter, onChange: changeCountry },
    { kind: "searchable", id: "city", label: "City", allLabel: countryFilter ? `All cities in ${countryLabel}` : "Select a country first", searchPlaceholder: "Search cities…", options: cityOptions, value: cityFilter, onChange: setCityFilter, disabled: !countryFilter },
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

  const toggle = (set: (fn: (v: string) => string) => void, value: string) => set((v) => (v === value ? "" : value))
  const discoverActive: DiscoverActive = {
    remote: remoteFilter === "REMOTE",
    internship: typeFilter === "INTERNSHIP",
    highSalary: minSalary === "1000000",
    today: postedWithin === "1",
    fresher: fresherOnly,
    walkin: walkinOnly,
    companyId: companyFilter,
    skill: skillFilter,
  }

  const onDiscoverPick = (p: DiscoverPick) => {
    if (p.kind === "remote") toggle(setRemoteFilter, "REMOTE")
    else if (p.kind === "internship") toggle(setTypeFilter, "INTERNSHIP")
    else if (p.kind === "highSalary") toggle(setMinSalary, "1000000")
    else if (p.kind === "today") toggle(setPostedWithin, "1")
    else if (p.kind === "fresher") setFresherOnly((v) => !v)
    else if (p.kind === "walkin") setWalkinOnly((v) => !v)
    else if (p.kind === "company") toggle(setCompanyFilter, p.id)
    else if (p.kind === "skill") toggle(setSkillFilter, p.name)
  }

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)")
    const sync = () => setSplitView(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  const selectedJob = splitView ? visibleJobs.find((j) => j.slug === selectedSlug) ?? visibleJobs[0] : undefined

  const selectJob = useCallback(
    (job: PrivateJobData) => {
      if (!splitView) return false
      setSelectedSlug(job.slug)
      return true
    },
    [splitView]
  )

  // j / k move through the list in split view (ignored while typing).
  useEffect(() => {
    if (!splitView) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (e.key !== "j" && e.key !== "k") return
      const i = visibleJobs.findIndex((j) => j.slug === selectedJob?.slug)
      const next = visibleJobs[Math.min(visibleJobs.length - 1, Math.max(0, i + (e.key === "j" ? 1 : -1)))]
      if (!next) return
      e.preventDefault()
      setSelectedSlug(next.slug)
      document.getElementById(`pj-${next.id}`)?.scrollIntoView({ block: "nearest" })
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [splitView, visibleJobs, selectedJob?.slug])

  const loadingFirst = loading && jobs.length === 0

  return (
    <DeskListing
      hero={<AirmailHero total={total} mode={preset.remote === "REMOTE" ? "remote" : preset.fresher === "1" ? "fresher" : preset.walkin === "1" ? "walkin" : "all"} />}
      filters={{
        search,
        onSearchChange: setSearch,
        onSearchSubmit: () => setSearch((value) => value.trim()),
        searchPlaceholder: "Search title, company, skill, location…",
        filters,
        quickFilters,
        onClear: clearFilters,
        hasActiveFilters,
        activeCount,
        railTop: <PrivateJobsPulse onPick={onDiscoverPick} active={discoverActive} />,
        railBottom: <PrivateJobsTrending onPick={onDiscoverPick} active={discoverActive} />,
      }}
      aside={<SafeLetter />}
      toolbar={
        <ListingToolbar
          count={visibleJobs.length}
          total={total}
          label="private jobs"
          refreshing={refreshing}
          sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
          activeFilters={activeFilters}
          onClearAll={clearFilters}
        />
      }
      loading={loadingFirst}
      error={error && jobs.length === 0 ? error : null}
      onRetry={retry}
      errorTitle="The post is running late."
      empty={visibleJobs.length === 0}
      emptyTitle="No letters in this pile."
      emptyHint="Try fewer filters, or another country or city. New roles arrive every day."
      loadingMore={false}
      skeleton={<AirmailRowSkeleton />}
      gridClassName="grid gap-4"
      footer={
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
      }
    >
      <div className={splitView ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-start gap-5" : undefined}>
        <div>
          <ul className="grid gap-4" aria-label="Private jobs">
            {visibleJobs.map((job, index) => (
              <li key={job.id} id={`pj-${job.id}`} className="scroll-mt-28">
                <AirmailJobRow job={job} index={index} nowMs={nowMs} selected={selectedJob?.id === job.id} onSelect={selectJob} />
              </li>
            ))}
          </ul>
          {loadingMore ? (
            <div className="mt-4 grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <AirmailRowSkeleton key={index} />
              ))}
            </div>
          ) : null}
        </div>
        {splitView && <OpenedLetter>{selectedJob ? <PrivateJobPreview key={selectedJob.id} job={selectedJob} nowMs={nowMs} /> : <PrivateJobPreviewEmpty />}</OpenedLetter>}
      </div>
    </DeskListing>
  )
}
