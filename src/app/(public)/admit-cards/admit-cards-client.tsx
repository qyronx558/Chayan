"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, Calendar, Ticket } from "lucide-react"
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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SectionHero
          icon={Ticket}
          badge="Admit Cards"
          title="Admit Cards"
          subtitle="Download admit cards and hall tickets for upcoming government exams."
          count={total}
        />

        <ListingLayout
          filters={
            <ListingFilters
              search={search}
              onSearchChange={setSearch}
              onSearchSubmit={() => setSearch((value) => value.trim())}
              searchPlaceholder="Search admit cards…"
              filters={filters}
              quickFilters={quickFilters}
              onClear={clearFilters}
              hasActiveFilters={hasActiveFilters}
              activeCount={activeCount}
            />
          }
        >
          <ListingToolbar
            count={visibleItems.length}
            total={total}
            label="admit cards"
            refreshing={refreshing}
            sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
            activeFilters={activeFilters}
            onClearAll={clearFilters}
          />

          {loading && items.length === 0 ? (
            <div className={listGridWithSidebar}>
              {Array.from({ length: 9 }).map((_, index) => (
                <UniversalCardSkeleton key={index} />
              ))}
            </div>
          ) : error && items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <AlertCircle className="mb-4 h-12 w-12 text-brick" />
                <h3 className="mb-2 text-lg font-semibold text-foreground">Something went wrong</h3>
                <p className="mb-4 text-sm text-muted-foreground">{error}</p>
                <Button onClick={retry}>Try Again</Button>
              </CardContent>
            </Card>
          ) : visibleItems.length === 0 ? (
            <UniversalCardEmpty
              title="No admit cards found"
              hint="Try adjusting your search or filter criteria."
              action={hasActiveFilters ? <Button variant="outline" onClick={clearFilters}>Clear Filters</Button> : undefined}
            />
          ) : (
            <>
              <div className={listGridWithSidebar}>
                {visibleItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.35 }}
                    className="h-full"
                  >
                    <UniversalCard
                      module="admitCard"
                      title={cleanTitle(item.title)}
                      organization={item.department.name}
                      metadata={item.examDate ? [{ icon: Calendar, text: `Exam: ${formatDate(item.examDate)}` }] : []}
                      primaryCtaUrl={`/admit-card/${item.slug}`}
                      save={<BookmarkButton admitCardId={item.id} />}
                      share={<CardShareButton title={cleanTitle(item.title)} url={`/admit-card/${item.slug}`} />}
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
                loadedCount={visibleItems.length}
                total={total}
                label="admit cards"
              />
            </>
          )}
        </ListingLayout>
      </motion.div>
    </div>
  )
}
