"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"
import { AdmissionBanner, AdmissionFormCard, DocumentChecklist } from "./admission-desk"
import { DeskItem, DeskListing } from "@/components/desk/DeskKit"
import { CardShareButton } from "@/components/ui/card-actions"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { ListingToolbar } from "@/components/listing/ListingToolbar"
import type { ActiveFilterChip, FilterControl, QuickFilter, SortOption } from "@/components/listing/types"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useFilterOptions } from "@/hooks/useFilterOptions"
import { useInfiniteListing } from "@/hooks/useInfiniteListing"
import { useListingQuerySync } from "@/hooks/useListingQuerySync"
import { InfiniteListFooter } from "@/components/ui/infinite-list-footer"

interface AdmissionData {
  id: string
  title: string
  slug: string
  description: string | null
  startDate: string | null
  lastDate: string | null
  applicationFee: string | null
  pdfUrl: string | null
  status: string | null
  department: { id: string; name: string; slug: string }
}

const SORT_OPTIONS: SortOption[] = [
  { value: "latest", label: "Newest" },
  { value: "last_date_asc", label: "Last date (soonest)" },
  { value: "last_date_desc", label: "Last date (latest)" },
  { value: "start_date_asc", label: "Start date" },
  { value: "oldest", label: "Oldest posted" },
  { value: "trending", label: "Trending" },
]

const POSTED_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
]

export function AdmissionsClient() {
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoryId") ?? "")
  const [selectedDepartment, setSelectedDepartment] = useState(searchParams.get("departmentId") ?? "")
  const [postedWithin, setPostedWithin] = useState(searchParams.get("postedWithin") ?? "")
  const [openNow, setOpenNow] = useState(searchParams.get("openNow") === "1")
  const [closingSoon, setClosingSoon] = useState(searchParams.get("closingSoon") === "1")
  const [hasPdf, setHasPdf] = useState(searchParams.get("hasPdf") === "1")
  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") ?? "")
  const [toDate, setToDate] = useState(searchParams.get("toDate") ?? "")
  const [sort, setSort] = useState(searchParams.get("sort") ?? "latest")

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const { categories, departments } = useFilterOptions()

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      categoryId: selectedCategory,
      departmentId: selectedDepartment,
      postedWithin,
      openNow: openNow ? "1" : "",
      closingSoon: closingSoon ? "1" : "",
      hasPdf: hasPdf ? "1" : "",
      fromDate,
      toDate,
      sort,
    }),
    [debouncedSearch, selectedCategory, selectedDepartment, postedWithin, openNow, closingSoon, hasPdf, fromDate, toDate, sort]
  )

  const {
    items,
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
  } = useInfiniteListing<AdmissionData>({ endpoint: "/api/admissions", params })

  useListingQuerySync({
    search: debouncedSearch,
    categoryId: selectedCategory,
    departmentId: selectedDepartment,
    postedWithin,
    openNow: openNow ? "1" : "",
    closingSoon: closingSoon ? "1" : "",
    hasPdf: hasPdf ? "1" : "",
    fromDate,
    toDate,
    sort,
  })

  const clearFilters = () => {
    setSearch("")
    setSelectedCategory("")
    setSelectedDepartment("")
    setPostedWithin("")
    setOpenNow(false)
    setClosingSoon(false)
    setHasPdf(false)
    setFromDate("")
    setToDate("")
    setSort("latest")
  }

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      selectedCategory ||
      selectedDepartment ||
      postedWithin ||
      openNow ||
      closingSoon ||
      hasPdf ||
      fromDate ||
      toDate
  )

  const activeCount = [
    debouncedSearch,
    selectedCategory,
    selectedDepartment,
    postedWithin,
    openNow,
    closingSoon,
    hasPdf,
    fromDate || toDate,
  ].filter(Boolean).length

  const categoryName = categories.find((item) => item.id === selectedCategory)?.name
  const departmentName = departments.find((item) => item.id === selectedDepartment)?.name
  const postedName = POSTED_OPTIONS.find((item) => item.value === postedWithin)?.label

  const activeFilters: ActiveFilterChip[] = []
  if (debouncedSearch) activeFilters.push({ id: "search", label: `Search: ${debouncedSearch}`, onRemove: () => setSearch("") })
  if (categoryName) activeFilters.push({ id: "category", label: categoryName, onRemove: () => setSelectedCategory("") })
  if (departmentName) activeFilters.push({ id: "department", label: departmentName, onRemove: () => setSelectedDepartment("") })
  if (postedWithin) activeFilters.push({ id: "posted", label: postedName ?? `Posted within ${postedWithin}d`, onRemove: () => setPostedWithin("") })
  if (openNow) activeFilters.push({ id: "openNow", label: "Open now", onRemove: () => setOpenNow(false) })
  if (closingSoon) activeFilters.push({ id: "closing", label: "Closing in 7 days", onRemove: () => setClosingSoon(false) })
  if (hasPdf) activeFilters.push({ id: "pdf", label: "PDF available", onRemove: () => setHasPdf(false) })
  if (fromDate || toDate) {
    activeFilters.push({
      id: "lastDate",
      label: `Last date: ${fromDate || "any"} → ${toDate || "any"}`,
      onRemove: () => {
        setFromDate("")
        setToDate("")
      },
    })
  }

  const quickFilters: QuickFilter[] = [
    { id: "open", label: "Open now", active: openNow, onToggle: () => setOpenNow((value) => !value) },
    { id: "closing", label: "Closing soon", active: closingSoon, onToggle: () => setClosingSoon((value) => !value) },
    { id: "pdf", label: "PDF available", active: hasPdf, onToggle: () => setHasPdf((value) => !value) },
  ]

  const filters: FilterControl[] = [
    {
      kind: "searchable",
      id: "category",
      label: "Category",
      allLabel: "All categories",
      searchPlaceholder: "Search categories…",
      options: categories,
      value: selectedCategory,
      onChange: setSelectedCategory,
    },
    {
      kind: "searchable",
      id: "department",
      label: "Department",
      allLabel: "All departments",
      searchPlaceholder: "Search departments…",
      options: departments,
      value: selectedDepartment,
      onChange: setSelectedDepartment,
    },
    { kind: "select", id: "posted", label: "Posted", value: postedWithin, options: POSTED_OPTIONS, onChange: setPostedWithin },
    { kind: "dateRange", id: "lastDate", label: "Last date", from: fromDate, to: toDate, onChange: (from, to) => { setFromDate(from); setToDate(to) } },
    { kind: "toggle", id: "openNow", label: "Open now", description: "Applications still being accepted", checked: openNow, onChange: setOpenNow },
    { kind: "toggle", id: "closing", label: "Closing soon", description: "Deadline within the next 7 days", checked: closingSoon, onChange: setClosingSoon },
    { kind: "toggle", id: "pdf", label: "Has PDF", description: "Only admissions with a downloadable PDF", checked: hasPdf, onChange: setHasPdf },
  ]

  const visibleItems = filterValidItems(items)

  return (
    <DeskListing
      hero={<AdmissionBanner total={total} />}
      filters={{
        search,
        onSearchChange: setSearch,
        onSearchSubmit: () => setSearch((value) => value.trim()),
        searchPlaceholder: "Search admissions…",
        filters,
        quickFilters,
        onClear: clearFilters,
        hasActiveFilters,
        activeCount,
      }}
      aside={<DocumentChecklist />}
      toolbar={
        <ListingToolbar
          count={visibleItems.length}
          total={total}
          label="admissions"
          refreshing={refreshing}
          sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
          activeFilters={activeFilters}
          onClearAll={clearFilters}
        />
      }
      loading={loading && items.length === 0}
      error={error && items.length === 0 ? error : null}
      onRetry={retry}
      errorTitle="The counter is closed for a moment."
      empty={visibleItems.length === 0}
      emptyTitle="No forms in this pile."
      emptyHint="Nothing matches these filters right now. Loosen one of them, or check back: new notices arrive through the season."
      loadingMore={loadingMore}
      footer={
        <InfiniteListFooter
          sentinelRef={sentinelRef}
          hasMore={hasMore}
          loadingMore={loadingMore}
          loadMoreError={loadMoreError}
          onLoadMore={loadMore}
          onRetry={loadMore}
          loadedCount={visibleItems.length}
          total={total}
          label="admissions"
        />
      }
    >
      {visibleItems.map((item, index) => (
        <DeskItem key={item.id} index={index}>
          <AdmissionFormCard
            item={item}
            index={index}
            track={<ApplicationTracker jobId={item.id} type="admission" />}
            share={<CardShareButton title={cleanTitle(item.title)} url={`/admission/${item.slug}`} />}
          />
        </DeskItem>
      ))}
    </DeskListing>
  )
}
