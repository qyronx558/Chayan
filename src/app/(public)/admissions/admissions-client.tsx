"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, Calendar, GraduationCap, IndianRupee } from "lucide-react"
import { SectionHero } from "@/components/layout/SectionHero"
import { formatDate } from "@/lib/utils"
import { UniversalCard, UniversalCardSkeleton, UniversalCardEmpty } from "@/components/ui/universal-card"
import { listGridWithSidebar } from "@/components/ui/module-theme"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"
import { CardShareButton } from "@/components/ui/card-actions"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
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
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SectionHero
          icon={GraduationCap}
          badge="Admissions"
          title="Admissions"
          subtitle="Latest government admission notifications for various courses and programs."
          count={total}
        />

        <ListingLayout
          filters={
            <ListingFilters
              search={search}
              onSearchChange={setSearch}
              onSearchSubmit={() => setSearch((value) => value.trim())}
              searchPlaceholder="Search admissions…"
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
            label="admissions"
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
              title="No admissions found"
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
                      module="admission"
                      title={cleanTitle(item.title)}
                      organization={item.department.name}
                      description={item.description}
                      metadata={[
                        ...(item.lastDate ? [{ icon: Calendar, text: `Last: ${formatDate(item.lastDate)}`, highlight: true }] : []),
                        ...(item.startDate ? [{ icon: Calendar, text: `Start: ${formatDate(item.startDate)}` }] : []),
                        ...(item.applicationFee ? [{ icon: IndianRupee, text: `Fee: ${item.applicationFee}` }] : []),
                      ]}
                      primaryCtaUrl={`/admission/${item.slug}`}
                      track={<ApplicationTracker jobId={item.id} type="admission" />}
                      share={<CardShareButton title={cleanTitle(item.title)} url={`/admission/${item.slug}`} />}
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
                label="admissions"
              />
            </>
          )}
        </ListingLayout>
      </motion.div>
    </div>
  )
}
