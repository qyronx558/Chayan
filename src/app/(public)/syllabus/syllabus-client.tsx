"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { AlertCircle, Book, BookOpen } from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { SectionHero } from "@/components/layout/SectionHero"
import { UniversalCard, UniversalCardSkeleton, UniversalCardEmpty } from "@/components/ui/universal-card"
import { CardShareButton } from "@/components/ui/card-actions"
import { listGridWithSidebar } from "@/components/ui/module-theme"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"
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

interface SyllabusData {
  id: string
  title: string
  slug: string
  description: string | null
  subjects: string | null
  pdfUrl: string | null
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

const getSubjectsList = (subjects: string | null): string[] => {
  if (!subjects) return []
  try {
    const parsed = JSON.parse(subjects)
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [subjects]
  } catch {
    return subjects.split(",").map((subject) => subject.trim()).slice(0, 3)
  }
}

export function SyllabusClient() {
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
  } = useInfiniteListing<SyllabusData>({ endpoint: "/api/syllabus", params })

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
    { kind: "text", id: "subject", label: "Subject", placeholder: "e.g. Maths, Reasoning", value: subject, onChange: setSubject },
    { kind: "select", id: "posted", label: "Posted", value: postedWithin, options: POSTED_OPTIONS, onChange: setPostedWithin },
    { kind: "toggle", id: "pdf", label: "Has PDF", description: "Only syllabus with a downloadable PDF", checked: hasPdf, onChange: setHasPdf },
  ]

  const visibleItems = filterValidItems(items)

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <SectionHero
          icon={BookOpen}
          badge="Syllabus"
          title="Syllabus"
          subtitle="Download detailed subject-wise syllabus for government exams and plan your preparation."
          count={total}
        />

        <ListingLayout
          filters={
            <ListingFilters
              search={search}
              onSearchChange={setSearch}
              onSearchSubmit={() => setSearch((value) => value.trim())}
              searchPlaceholder="Search syllabus…"
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
            label="syllabus entries"
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
              title="No syllabus found"
              hint="Try adjusting your search or filter criteria."
              action={hasActiveFilters ? <Button variant="outline" onClick={clearFilters}>Clear Filters</Button> : undefined}
            />
          ) : (
            <>
              <div className={listGridWithSidebar}>
                {visibleItems.map((item) => {
                  const subjects = getSubjectsList(item.subjects)
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.35 }}
                      className="h-full"
                    >
                      <UniversalCard
                        module="syllabus"
                        title={cleanTitle(item.title)}
                        organization={item.department.name}
                        description={item.description}
                        metadata={subjects.length > 0 ? [{ icon: Book, text: subjects.join(", ") }] : []}
                        primaryCtaUrl={`/syllabus/${item.slug}`}
                        save={<BookmarkButton syllabusId={item.id} />}
                        share={<CardShareButton title={cleanTitle(item.title)} url={`/syllabus/${item.slug}`} />}
                      />
                    </motion.div>
                  )
                })}
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
                label="syllabus entries"
              />
            </>
          )}
        </ListingLayout>
      </motion.div>
    </div>
  )
}
