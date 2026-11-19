"use client"

import { ResultSheetCard, ResultsBoard, RollNumberChit } from "./result-board"
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

const SORT_OPTIONS: SortOption[] = [
  { value: "latest", label: "Newest" },
  { value: "result_date_asc", label: "Result date (oldest)" },
  { value: "oldest", label: "Oldest posted" },
  { value: "trending", label: "Trending" },
]

const POSTED_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
]

export function ResultsClient() {
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoryId") ?? "")
  const [selectedDepartment, setSelectedDepartment] = useState(searchParams.get("departmentId") ?? "")
  const [postedWithin, setPostedWithin] = useState(searchParams.get("postedWithin") ?? "")
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
      hasPdf: hasPdf ? "1" : "",
      fromDate,
      toDate,
      sort,
    }),
    [debouncedSearch, selectedCategory, selectedDepartment, postedWithin, hasPdf, fromDate, toDate, sort]
  )

  const {
    items: results,
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
  } = useInfiniteListing<ResultData>({ endpoint: "/api/results", params })

  useListingQuerySync({
    search: debouncedSearch,
    categoryId: selectedCategory,
    departmentId: selectedDepartment,
    postedWithin,
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
    setHasPdf(false)
    setFromDate("")
    setToDate("")
    setSort("latest")
  }

  const hasActiveFilters = Boolean(
    debouncedSearch || selectedCategory || selectedDepartment || postedWithin || hasPdf || fromDate || toDate
  )

  const activeCount = [
    debouncedSearch,
    selectedCategory,
    selectedDepartment,
    postedWithin,
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
  if (hasPdf) activeFilters.push({ id: "pdf", label: "PDF available", onRemove: () => setHasPdf(false) })
  if (fromDate || toDate) {
    activeFilters.push({
      id: "date",
      label: `Result date: ${fromDate || "any"} → ${toDate || "any"}`,
      onRemove: () => {
        setFromDate("")
        setToDate("")
      },
    })
  }

  const quickFilters: QuickFilter[] = [
    { id: "pdf", label: "PDF available", active: hasPdf, onToggle: () => setHasPdf((value) => !value) },
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
    { kind: "dateRange", id: "resultDate", label: "Result date", from: fromDate, to: toDate, onChange: (from, to) => { setFromDate(from); setToDate(to) } },
    { kind: "toggle", id: "pdf", label: "Has PDF", description: "Only results with a downloadable PDF", checked: hasPdf, onChange: setHasPdf },
  ]

  const visibleResults = filterValidItems(results)

  return (
    <DeskListing
      hero={<ResultsBoard total={total} />}
      filters={{
        search,
        onSearchChange: setSearch,
        onSearchSubmit: () => setSearch((value) => value.trim()),
        searchPlaceholder: "Search results…",
        filters,
        quickFilters,
        onClear: clearFilters,
        hasActiveFilters,
        activeCount,
      }}
      aside={<RollNumberChit />}
      toolbar={
        <ListingToolbar
          count={visibleResults.length}
          total={total}
          label="results"
          refreshing={refreshing}
          sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
          activeFilters={activeFilters}
          onClearAll={clearFilters}
        />
      }
      loading={loading && results.length === 0}
      error={error && results.length === 0 ? error : null}
      onRetry={retry}
      errorTitle="The board fell over for a second."
      empty={visibleResults.length === 0}
      emptyTitle="No list matches that, yet."
      emptyHint="Try fewer filters. Results keep going up through the week, so this board fills in fast."
      loadingMore={loadingMore}
      footer={
        <InfiniteListFooter
          sentinelRef={sentinelRef}
          hasMore={hasMore}
          loadingMore={loadingMore}
          loadMoreError={loadMoreError}
          onLoadMore={loadMore}
          onRetry={loadMore}
          loadedCount={visibleResults.length}
          total={total}
          label="results"
        />
      }
    >
      {visibleResults.map((item, index) => (
        <DeskItem key={item.id} index={index}>
          <ResultSheetCard
            item={item}
            index={index}
            save={<BookmarkButton resultId={item.id} />}
            share={<CardShareButton title={cleanTitle(item.title)} url={`/result/${item.slug}`} />}
          />
        </DeskItem>
      ))}
    </DeskListing>
  )
}
