"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Search, AlertCircle, Filter, X, Building2, Wifi, Sparkles, Flag, Briefcase } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UniversalCardSkeleton, UniversalCardEmpty } from "@/components/ui/universal-card"
import { moduleTheme } from "@/components/ui/module-theme"
import { filterValidItems } from "@/lib/card-helpers"
import { PrivateJobCard } from "@/components/private/PrivateJobCard"
import { JobRecommendations } from "@/components/jobs/JobRecommendations"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
 useInfiniteScroll,
 appendUnique,
 PUBLIC_INFINITE_LIMIT as LIMIT,
} from "@/hooks/useInfiniteScroll"
import { InfiniteListFooter } from "@/components/ui/infinite-list-footer"

interface Company { id: string; name: string; logo?: string | null; verifiedStatus?: string }

interface PrivateJobData {
 id: string; title: string; slug: string; type: string; category?: string | null
 description?: string | null; location?: string | null; salary?: string | null
 salaryMin?: number | null; salaryMax?: number | null
 experience?: string | null; applicationUrl?: string | null
 applicationEmail?: string | null; lastDate?: string | null; status: string
 remotePolicy?: string | null; isFresherFriendly?: boolean; isWalkIn?: boolean
 skills?: string[]; trustScore?: number; views?: number
 company: Company; createdAt: string
}

interface FilterOption { id: string; name: string }

const typeLabels: Record<string, string> = {
 FULL_TIME: "Full-Time", PART_TIME: "Part-Time", INTERNSHIP: "Internship", CONTRACT: "Contract",
}

export function PrivateJobsClient({ preset = {} as { remote?: string; fresher?: string; walkin?: string } }) {
 const [jobs, setJobs] = useState<PrivateJobData[]>([])
 const [total, setTotal] = useState(0)
 const [hasMore, setHasMore] = useState(false)
 const [loading, setLoading] = useState(true)
 const [loadingMore, setLoadingMore] = useState(false)
 const [error, setError] = useState("")
 const [loadMoreError, setLoadMoreError] = useState("")
 const [search, setSearch] = useState("")
 const [debouncedSearch, setDebouncedSearch] = useState("")
 const [typeFilter, setTypeFilter] = useState("")
 const [companyFilter, setCompanyFilter] = useState("")
 const [locationFilter, setLocationFilter] = useState("")
 const [remoteFilter, setRemoteFilter] = useState(preset.remote || "")
 const [skillFilter, setSkillFilter] = useState("")
 const [sort, setSort] = useState("new")
 const [fresherOnly, setFresherOnly] = useState(preset.fresher === "1")
 const [walkinOnly, setWalkinOnly] = useState(preset.walkin === "1")
 const pageRef = useRef(1)
 const abortRef = useRef<AbortController | null>(null)

 const [companies, setCompanies] = useState<FilterOption[]>([])
 const [locations, setLocations] = useState<string[]>([])
 const [types, setTypes] = useState<string[]>([])
 const [remotes, setRemotes] = useState<string[]>([])
 const [skills, setSkills] = useState<string[]>([])

 const [showFilters, setShowFilters] = useState(false)

 useEffect(() => {
  fetch("/api/private-jobs/filters")
   .then(r => r.json())
   .then(d => {
    if (d.success) {
     setCompanies(d.data.companies || [])
     setLocations(d.data.locations || [])
     setTypes(d.data.types || [])
     setRemotes(d.data.remotes || [])
     setSkills(d.data.skills || [])
    }
   })
   .catch(() => {})
 }, [])

 useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
  return () => clearTimeout(timer)
 }, [search])

 const fetchPage = useCallback(async (pageNum: number, replace: boolean, signal: AbortSignal) => {
  if (replace) {
   setLoading(true)
   setError("")
  } else {
   setLoadingMore(true)
   setLoadMoreError("")
  }
  try {
   const params = new URLSearchParams()
   if (debouncedSearch) params.set("search", debouncedSearch)
   if (typeFilter && typeFilter !== "all") params.set("type", typeFilter)
   if (companyFilter && companyFilter !== "all") params.set("companyId", companyFilter)
   if (locationFilter && locationFilter !== "all") params.set("location", locationFilter)
   if (remoteFilter && remoteFilter !== "all") params.set("remote", remoteFilter)
   if (skillFilter && skillFilter !== "all") params.set("skill", skillFilter)
   if (fresherOnly) params.set("fresher", "1")
   if (walkinOnly) params.set("walkin", "1")
   if (sort !== "new") params.set("sort", sort)
   params.set("page", String(pageNum))
   params.set("limit", String(LIMIT))

   const res = await fetch(`/api/private-jobs?${params}`, { signal })
   const json = await res.json()
   if (signal.aborted) return
   if (json.success) {
    setJobs((prev) => (replace ? json.data : appendUnique(prev, json.data)))
    setTotal(json.pagination.total ?? 0)
    setHasMore(pageNum < (json.pagination.totalPages ?? 1))
    pageRef.current = pageNum
   } else if (replace) {
    setError(json.error || "Failed to fetch private jobs")
   } else {
    setLoadMoreError(json.error || "Failed to load more. Please retry.")
   }
  } catch {
   if (signal.aborted) return
   if (replace) setError("Failed to fetch private jobs. Please try again.")
   else setLoadMoreError("Failed to load more. Please retry.")
  } finally {
   if (!signal.aborted) {
    if (replace) setLoading(false)
    else setLoadingMore(false)
   }
  }
 }, [debouncedSearch, typeFilter, companyFilter, locationFilter, remoteFilter, skillFilter, fresherOnly, walkinOnly, sort])

 useEffect(() => {
  abortRef.current?.abort()
  const controller = new AbortController()
  abortRef.current = controller
  pageRef.current = 1
  setHasMore(false)
  fetchPage(1, true, controller.signal)
  return () => controller.abort()
 }, [fetchPage])

 const loadMore = useCallback(() => {
  if (loading || loadingMore || !hasMore) return
  const controller = new AbortController()
  abortRef.current = controller
  fetchPage(pageRef.current + 1, false, controller.signal)
 }, [loading, loadingMore, hasMore, fetchPage])

 const retryInitial = useCallback(() => {
  abortRef.current?.abort()
  const controller = new AbortController()
  abortRef.current = controller
  fetchPage(1, true, controller.signal)
 }, [fetchPage])

 const sentinelRef = useInfiniteScroll({
  hasMore,
  isLoading: loading || loadingMore,
  onLoadMore: loadMore,
 })

 const visibleJobs = filterValidItems(jobs)

 const handleSearch = (e: React.FormEvent) => {
  e.preventDefault()
  setDebouncedSearch(search.trim())
 }

 const clearFilters = () => {
  setSearch("")
  setDebouncedSearch("")
  setTypeFilter("")
  setCompanyFilter("")
  setLocationFilter("")
  setRemoteFilter("")
  setSkillFilter("")
  setFresherOnly(false)
  setWalkinOnly(false)
  setSort("new")
 }

 const hasActiveFilters = debouncedSearch || typeFilter || companyFilter || locationFilter || remoteFilter || skillFilter || fresherOnly || walkinOnly || sort !== "new"

 return (
  <div className="container mx-auto max-w-7xl px-4 py-8">
   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
    <div className="mb-2 flex flex-wrap items-center gap-3">
     <h1 className="font-display text-3xl font-bold text-foreground">Private jobs</h1>
     <div className="flex gap-2 text-xs">
      <Link href="/private-jobs/remote" className="border border-rule px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick"><Wifi className="mr-1 inline h-3 w-3" />Remote</Link>
      <Link href="/private-jobs/freshers" className="border border-rule px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick"><Sparkles className="mr-1 inline h-3 w-3" />Freshers</Link>
      <Link href="/private-jobs/walkins" className="border border-rule px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick"><Flag className="mr-1 inline h-3 w-3" />Walk-ins</Link>
      <Link href="/private-jobs/refer" className="border border-rule px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:border-brick hover:text-brick">+ Refer a job</Link>
     </div>
    </div>
    <p className="mb-8 max-w-2xl text-muted-foreground">
     Full-time, part-time, internships, and contract positions from top companies - with trust scores, tracking and prep.
    </p>

    {/* ── Search row - same structure as gov JobsClient ── */}
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
     <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
       placeholder="Search by title, company or skill..."
       value={search}
       onChange={(e) => setSearch(e.target.value)}
       className="pl-10 pr-10"
      />
      {search && (
       <button
        type="button"
        onClick={() => { setSearch("") }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brick"
       >
        <X className="h-4 w-4" />
       </button>
      )}
     </form>
     <Button
      variant="outline"
      size="sm"
      onClick={() => setShowFilters(!showFilters)}
      className="sm:hidden"
     >
      <Filter className="mr-2 h-4 w-4" />
      Filters
     </Button>
     {hasActiveFilters && (
      <Button variant="ghost" size="sm" onClick={clearFilters}>
       <X className="mr-2 h-4 w-4" />
       Clear Filters
      </Button>
     )}
    </div>

    {/* ── Filter grid - same grid positions as gov (1 / 2 / 4 cols) ── */}
    <div className={`mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${showFilters ? "grid" : "hidden lg:grid"}`}>
     <Select value={companyFilter} onValueChange={(v) => { setCompanyFilter(v === "all" ? "" : v) }}>
      <SelectTrigger className="w-full">
       <Building2 className="mr-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
       <SelectValue placeholder="All Companies" />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="all">All Companies</SelectItem>
       {companies.map(c => (
        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
       ))}
      </SelectContent>
     </Select>

     <Select value={locationFilter} onValueChange={(v) => { setLocationFilter(v === "all" ? "" : v) }}>
      <SelectTrigger className="w-full">
       <SelectValue placeholder="All Locations" />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="all">All Locations</SelectItem>
       {locations.map(l => (
        <SelectItem key={l} value={l}>{l}</SelectItem>
       ))}
      </SelectContent>
     </Select>

     <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v === "all" ? "" : v) }}>
      <SelectTrigger className="w-full">
       <Briefcase className="mr-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
       <SelectValue placeholder="All Types" />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="all">All Types</SelectItem>
       {types.map(t => (
        <SelectItem key={t} value={t}>{typeLabels[t] || t}</SelectItem>
       ))}
      </SelectContent>
     </Select>

     <Select value={remoteFilter} onValueChange={(v) => { setRemoteFilter(v === "all" ? "" : v) }}>
      <SelectTrigger className="w-full">
       <Wifi className="mr-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
       <SelectValue placeholder="Work mode" />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="all">All modes</SelectItem>
       <SelectItem value="REMOTE">Remote</SelectItem>
       <SelectItem value="HYBRID">Hybrid</SelectItem>
       <SelectItem value="ONSITE">On-site</SelectItem>
       {remotes.filter(r => !["REMOTE", "HYBRID", "ONSITE"].includes(r)).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
      </SelectContent>
     </Select>

     {skills.length > 0 && (
      <Select value={skillFilter} onValueChange={(v) => { setSkillFilter(v === "all" ? "" : v) }}>
       <SelectTrigger className="w-full">
        <Sparkles className="mr-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <SelectValue placeholder="Skill" />
       </SelectTrigger>
       <SelectContent>
        <SelectItem value="all">All skills</SelectItem>
        {skills.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
       </SelectContent>
      </Select>
     )}

     <Select value={sort} onValueChange={(v) => { setSort(v) }}>
      <SelectTrigger className="w-full">
       <SelectValue placeholder="Sort" />
      </SelectTrigger>
      <SelectContent>
       <SelectItem value="new">Newest</SelectItem>
       <SelectItem value="trust">Most trusted</SelectItem>
       <SelectItem value="salary">Highest salary</SelectItem>
      </SelectContent>
     </Select>

     <div className="flex items-center gap-2">
      <Button variant={fresherOnly ? "default" : "outline"} size="sm" onClick={() => { setFresherOnly(!fresherOnly) }}>Freshers</Button>
      <Button variant={walkinOnly ? "default" : "outline"} size="sm" onClick={() => { setWalkinOnly(!walkinOnly) }}>Walk-in</Button>
     </div>
    </div>

    <div className="mb-6">
     <JobRecommendations />
    </div>

    {loading ? (
     <div className={moduleTheme.privateJob.listGrid}>
      {Array.from({ length: LIMIT }).map((_, i) => (
       <UniversalCardSkeleton key={i} />
      ))}
     </div>
    ) : error ? (
     <Card>
      <CardContent className="flex flex-col items-center py-16">
       <AlertCircle className="mb-4 h-12 w-12 text-brick" />
       <h3 className="mb-2 font-display text-lg font-semibold text-foreground">Something went wrong</h3>
       <p className="mb-4 text-sm text-muted-foreground">{error}</p>
       <Button onClick={retryInitial}>Try Again</Button>
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
      <div className="agate mb-4 text-sm text-muted-foreground">
       Showing {visibleJobs.length} of {total} private jobs
      </div>
      <div className={moduleTheme.privateJob.listGrid}>
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
      {loadingMore && (
       <div className={`mt-6 ${moduleTheme.privateJob.listGrid}`}>
        {Array.from({ length: 3 }).map((_, i) => (
         <UniversalCardSkeleton key={i} />
        ))}
       </div>
      )}
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
   </motion.div>
  </div>
 )
}
