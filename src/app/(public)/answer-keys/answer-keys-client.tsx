"use client"

import { OmrHero, OmrKeyCard, RoughWork } from "./omr-sheet"
import { DeskItem, DeskListing } from "@/components/desk/DeskKit"
import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CardShareButton } from "@/components/ui/card-actions"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"
import { ListingToolbar } from "@/components/listing/ListingToolbar"
import type { ActiveFilterChip, FilterControl, QuickFilter, SortOption } from "@/components/listing/types"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useFilterOptions } from "@/hooks/useFilterOptions"
import { useInfiniteListing } from "@/hooks/useInfiniteListing"
import { useListingQuerySync } from "@/hooks/useListingQuerySync"
import { InfiniteListFooter } from "@/components/ui/infinite-list-footer"

interface AnswerKeyData {
  id: string
  title: string
  slug: string
  pdfUrl: string | null
  description: string | null
  status: string | null
  department: { id: string; name: string; slug: string }
}

const SORT_OPTIONS: SortOption[] = [
  { value: "latest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "trending", label: "Trending" },
]

const POSTED_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
]

export function AnswerKeysClient() {
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") ?? "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoryId") ?? "")
  const [selectedDepartment, setSelectedDepartment] = useState(searchParams.get("departmentId") ?? "")
  const [subject, setSubject] = useState(searchParams.get("subject") ?? "")
  const [postedWithin, setPostedWithin] = useState(searchParams.get("postedWithin") ?? "")
  const [hasPdf, setHasPdf] = useState(searchParams.get("hasPdf") === "1")
  const [sort, setSort] = useState(searchParams.get("sort") ?? "latest")

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const debouncedSubject = useDebouncedValue(subject.trim(), 300)
  const { categories, departments } = useFilterOptions()

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      categoryId: selectedCategory,
      departmentId: selectedDepartment,
      subject: debouncedSubject,
      postedWithin,
      hasPdf: hasPdf ? "1" : "",
      sort,
    }),
    [debouncedSearch, selectedCategory, selectedDepartment, debouncedSubject, postedWithin, hasPdf, sort]
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
  } = useInfiniteListing<AnswerKeyData>({ endpoint: "/api/answer-keys", params })

  useListingQuerySync({
    search: debouncedSearch,
    categoryId: selectedCategory,
    departmentId: selectedDepartment,
    subject: debouncedSubject,
    postedWithin,
    hasPdf: hasPdf ? "1" : "",
    sort,
  })

  const clearFilters = () => {
    setSearch("")
    setSelectedCategory("")
    setSelectedDepartment("")
    setSubject("")
    setPostedWithin("")
    setHasPdf(false)
    setSort("latest")
  }

  const hasActiveFilters = Boolean(
    debouncedSearch || selectedCategory || selectedDepartment || debouncedSubject || postedWithin || hasPdf
  )

  const activeCount = [
    debouncedSearch,
    selectedCategory,
    selectedDepartment,
    debouncedSubject,
    postedWithin,
    hasPdf,
  ].filter(Boolean).length

  const categoryName = categories.find((item) => item.id === selectedCategory)?.name
  const departmentName = departments.find((item) => item.id === selectedDepartment)?.name
  const postedName = POSTED_OPTIONS.find((item) => item.value === postedWithin)?.label

  const activeFilters: ActiveFilterChip[] = []
  if (debouncedSearch) activeFilters.push({ id: "search", label: `Search: ${debouncedSearch}`, onRemove: () => setSearch("") })
  if (categoryName) activeFilters.push({ id: "category", label: categoryName, onRemove: () => setSelectedCategory("") })
  if (departmentName) activeFilters.push({ id: "department", label: departmentName, onRemove: () => setSelectedDepartment("") })
  if (debouncedSubject) activeFilters.push({ id: "subject", label: `Subject: ${debouncedSubject}`, onRemove: () => setSubject("") })
  if (postedWithin) activeFilters.push({ id: "posted", label: postedName ?? `Posted within ${postedWithin}d`, onRemove: () => setPostedWithin("") })
  if (hasPdf) activeFilters.push({ id: "pdf", label: "PDF available", onRemove: () => setHasPdf(false) })

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
    { kind: "text", id: "subject", label: "Subject", placeholder: "e.g. Maths, GK", value: subject, onChange: setSubject },
    { kind: "select", id: "posted", label: "Posted", value: postedWithin, options: POSTED_OPTIONS, onChange: setPostedWithin },
    { kind: "toggle", id: "pdf", label: "Has PDF", description: "Only answer keys with a downloadable PDF", checked: hasPdf, onChange: setHasPdf },
  ]

  const visibleItems = filterValidItems(items)

  return (
    <DeskListing
      hero={<OmrHero total={total} />}
      filters={{
        search,
        onSearchChange: setSearch,
        onSearchSubmit: () => setSearch((value) => value.trim()),
        searchPlaceholder: "Search answer keys…",
        filters,
        quickFilters,
        onClear: clearFilters,
        hasActiveFilters,
        activeCount,
      }}
      aside={<RoughWork />}
      toolbar={
        <ListingToolbar
          count={visibleItems.length}
          total={total}
          label="answer keys"
          refreshing={refreshing}
          sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
          activeFilters={activeFilters}
          onClearAll={clearFilters}
        />
      }
      loading={loading && items.length === 0}
      error={error && items.length === 0 ? error : null}
      onRetry={retry}
      errorTitle="The red pen ran dry for a second."
      empty={visibleItems.length === 0}
      emptyTitle="No key matches that, yet."
      emptyHint="Try fewer filters. Keys usually come out a few days after the exam."
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
          label="answer keys"
        />
      }
    >
      {visibleItems.map((item, index) => (
        <DeskItem key={item.id} index={index}>
          <OmrKeyCard
            item={item}
            index={index}
            share={<CardShareButton title={cleanTitle(item.title)} url={`/answer-key/${item.slug}`} />}
          />
        </DeskItem>
      ))}
    </DeskListing>
  )
}
