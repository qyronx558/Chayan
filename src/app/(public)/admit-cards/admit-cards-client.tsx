"use client"

import { HallTicketCard, HallTicketHero, NightBeforeChecklist } from "./hall-ticket"
import { DeskItem, DeskListing } from "@/components/desk/DeskKit"
import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { CardShareButton } from "@/components/ui/card-actions"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"
import { ListingToolbar } from "@/components/listing/ListingToolbar"
import type { ActiveFilterChip, FilterControl, QuickFilter, SortOption } from "@/components/listing/types"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useFilterOptions } from "@/hooks/useFilterOptions"
import { useInfiniteListing } from "@/hooks/useInfiniteListing"
import { useListingQuerySync } from "@/hooks/useListingQuerySync"
import { InfiniteListFooter } from "@/components/ui/infinite-list-footer"

interface AdmitCardData {
  id: string
  title: string
  slug: string
  examDate: string | null
  downloadUrl: string | null
  status: string | null
  department: { id: string; name: string; slug: string }
}

const SORT_OPTIONS: SortOption[] = [
  { value: "latest", label: "Newest" },
  { value: "exam_date_asc", label: "Exam date (soonest)" },
  { value: "exam_date_desc", label: "Exam date (latest)" },
  { value: "oldest", label: "Oldest posted" },
  { value: "trending", label: "Trending" },
]

const POSTED_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
]

export function AdmitCardsClient() {
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoryId") ?? "")
  const [selectedDepartment, setSelectedDepartment] = useState(searchParams.get("departmentId") ?? "")
  const [postedWithin, setPostedWithin] = useState(searchParams.get("postedWithin") ?? "")
  const [upcoming, setUpcoming] = useState(searchParams.get("upcoming") === "1")
  const [hasDownload, setHasDownload] = useState(searchParams.get("hasDownload") === "1")
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
      upcoming: upcoming ? "1" : "",
      hasDownload: hasDownload ? "1" : "",
      fromDate,
      toDate,
      sort,
    }),
    [debouncedSearch, selectedCategory, selectedDepartment, postedWithin, upcoming, hasDownload, fromDate, toDate, sort]
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
  } = useInfiniteListing<AdmitCardData>({ endpoint: "/api/admit-cards", params })

  useListingQuerySync({
    search: debouncedSearch,
    categoryId: selectedCategory,
    departmentId: selectedDepartment,
    postedWithin,
    upcoming: upcoming ? "1" : "",
    hasDownload: hasDownload ? "1" : "",
    fromDate,
    toDate,
    sort,
  })

  const clearFilters = () => {
    setSearch("")
    setSelectedCategory("")
    setSelectedDepartment("")
    setPostedWithin("")
    setUpcoming(false)
    setHasDownload(false)
    setFromDate("")
    setToDate("")
    setSort("latest")
  }

  const hasActiveFilters = Boolean(
    debouncedSearch || selectedCategory || selectedDepartment || postedWithin || upcoming || hasDownload || fromDate || toDate
  )

  const activeCount = [
    debouncedSearch,
    selectedCategory,
    selectedDepartment,
    postedWithin,
    upcoming,
    hasDownload,
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
  if (upcoming) activeFilters.push({ id: "upcoming", label: "Upcoming exams", onRemove: () => setUpcoming(false) })
  if (hasDownload) activeFilters.push({ id: "download", label: "Download available", onRemove: () => setHasDownload(false) })
  if (fromDate || toDate) {
    activeFilters.push({
      id: "date",
      label: `Exam date: ${fromDate || "any"} → ${toDate || "any"}`,
      onRemove: () => {
        setFromDate("")
        setToDate("")
      },
    })
  }

  const quickFilters: QuickFilter[] = [
    { id: "upcoming", label: "Upcoming exams", active: upcoming, onToggle: () => setUpcoming((value) => !value) },
    { id: "download", label: "Download available", active: hasDownload, onToggle: () => setHasDownload((value) => !value) },
    { id: "week", label: "This week", active: postedWithin === "7", onToggle: () => setPostedWithin((value) => (value === "7" ? "" : "7")) },
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
    { kind: "dateRange", id: "examDate", label: "Exam date", from: fromDate, to: toDate, onChange: (from, to) => { setFromDate(from); setToDate(to) } },
    { kind: "toggle", id: "upcoming", label: "Upcoming only", description: "Exams scheduled from today onward", checked: upcoming, onChange: setUpcoming },
    { kind: "toggle", id: "download", label: "Has download link", description: "Only admit cards ready to download", checked: hasDownload, onChange: setHasDownload },
  ]

  const visibleItems = filterValidItems(items)

  return (
    <DeskListing
      hero={<HallTicketHero total={total} />}
      filters={{
        search,
        onSearchChange: setSearch,
        onSearchSubmit: () => setSearch((value) => value.trim()),
        searchPlaceholder: "Search admit cards…",
        filters,
        quickFilters,
        onClear: clearFilters,
        hasActiveFilters,
        activeCount,
      }}
      aside={<NightBeforeChecklist />}
      toolbar={
        <ListingToolbar
          count={visibleItems.length}
          total={total}
          label="admit cards"
          refreshing={refreshing}
          sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
          activeFilters={activeFilters}
          onClearAll={clearFilters}
        />
      }
      loading={loading && items.length === 0}
      error={error && items.length === 0 ? error : null}
      onRetry={retry}
      errorTitle="The printer jammed for a second."
      empty={visibleItems.length === 0}
      emptyTitle="No hall tickets in this pile."
      emptyHint="Try fewer filters. Admit cards usually land a week or two before the exam, so check back."
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
          label="admit cards"
        />
      }
    >
      {visibleItems.map((item, index) => (
        <DeskItem key={item.id} index={index}>
          <HallTicketCard
            item={item}
            index={index}
            save={<BookmarkButton admitCardId={item.id} />}
            share={<CardShareButton title={cleanTitle(item.title)} url={`/admit-card/${item.slug}`} />}
          />
        </DeskItem>
      ))}
    </DeskListing>
  )
}
