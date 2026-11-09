"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, Calendar, FileCheck2 } from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { SectionHero } from "@/components/layout/SectionHero"
import { UniversalCard, UniversalCardSkeleton, UniversalCardEmpty } from "@/components/ui/universal-card"
import { CardShareButton } from "@/components/ui/card-actions"
import { listGridWithSidebar } from "@/components/ui/module-theme"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ListingFilters } from "@/components/listing/ListingFilters"
import { ListingLayout } from "@/components/listing/ListingLayout"
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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SectionHero
          icon={FileCheck2}
          badge="Results"
          title="Exam Results"
          subtitle="Download the latest government exam result PDFs and check your outcome in one place."
          count={total}
        />

        <ListingLayout
          filters={
            <ListingFilters
              search={search}
              onSearchChange={setSearch}
              onSearchSubmit={() => setSearch((value) => value.trim())}
              searchPlaceholder="Search results…"
              filters={filters}
              quickFilters={quickFilters}
              onClear={clearFilters}
              hasActiveFilters={hasActiveFilters}
              activeCount={activeCount}
            />
          }
        >
          <ListingToolbar
            count={visibleResults.length}
            total={total}
            label="results"
            refreshing={refreshing}
            sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
            activeFilters={activeFilters}
            onClearAll={clearFilters}
          />

          {loading && results.length === 0 ? (
            <div className={listGridWithSidebar}>
              {Array.from({ length: 9 }).map((_, index) => (
                <UniversalCardSkeleton key={index} />
              ))}
            </div>
          ) : error && results.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <AlertCircle className="mb-4 h-12 w-12 text-brick" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">Something went wrong</h3>
                <p className="mb-4 text-sm text-muted-foreground">{error}</p>
                <Button onClick={retry}>Try Again</Button>
              </CardContent>
            </Card>
          ) : visibleResults.length === 0 ? (
            <UniversalCardEmpty
              title="No results found"
              hint="Try adjusting your search or filter criteria."
              action={hasActiveFilters ? <Button variant="outline" onClick={clearFilters}>Clear Filters</Button> : undefined}
            />
          ) : (
            <>
              <div className={listGridWithSidebar}>
                {visibleResults.map((result) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.35 }}
                    className="h-full"
                  >
                    <UniversalCard
                      module="result"
                      title={cleanTitle(result.title)}
                      organization={result.department.name}
                      description={result.description}
                      metadata={result.resultDate ? [{ icon: Calendar, text: formatDate(result.resultDate) }] : []}
                      primaryCtaUrl={`/result/${result.slug}`}
                      save={<BookmarkButton resultId={result.id} />}
                      share={<CardShareButton title={cleanTitle(result.title)} url={`/result/${result.slug}`} />}
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
                loadedCount={visibleResults.length}
                total={total}
                label="results"
              />
            </>
          )}
        </ListingLayout>
      </motion.div>
    </div>
  )
}
