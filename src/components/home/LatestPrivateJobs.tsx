"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Building2 } from "lucide-react"
import { cn, formatCompact } from "@/lib/utils"
import { SectionTabs } from "@/components/home/SectionTabs"
import { useHomeSection } from "@/components/home/use-home-section"
import { useSiteStats } from "@/components/home/use-site-stats"
import { HomeRowSkeleton } from "@/components/home/HomeJobRow"
import { HomePrivateJobRow, type HomePrivateJob } from "@/components/home/HomePrivateJobRow"
import { filterValidItems } from "@/lib/card-helpers"

type FilterKey = "all" | "remote" | "fresher" | "walkin" | "internship"

const FILTERS: { key: FilterKey; label: string; query: string; href: string }[] = [
  { key: "all", label: "All", query: "", href: "/private-jobs" },
  { key: "remote", label: "Remote", query: "&remote=REMOTE", href: "/private-jobs/remote" },
  { key: "fresher", label: "Freshers", query: "&fresher=1", href: "/private-jobs/freshers" },
  { key: "walkin", label: "Walk-ins", query: "&walkin=1", href: "/private-jobs/walkins" },
  { key: "internship", label: "Internships", query: "&type=INTERNSHIP", href: "/private-jobs?type=INTERNSHIP" },
]

/** Feed keyed by filter so Latest/Trending caches reset whenever the filter changes. */
function PrivateJobsFeed({ filter }: { filter: (typeof FILTERS)[number] }) {
  const base = `/api/private-jobs?limit=7&status=ACTIVE${filter.query}`
  const { latest, trending, trendingMeta, tab, selectTab, loading, trendingLoading } = useHomeSection(
    base,
    `${base}&sort=trending`
  )
  const jobs = filterValidItems(((tab === "trending" ? trending : latest) ?? []) as unknown as HomePrivateJob[]).slice(0, 7)
  const busy = tab === "trending" ? trendingLoading && trending === null : loading

  return (
    <>
      <div className="flex items-center justify-between gap-3 pt-3">
        <p className="truncate text-[12px] italic text-muted-foreground">
          {tab === "trending" && trendingMeta && !trendingMeta.fallback
            ? `Most viewed over the last ${trendingMeta.windowDays} days`
            : `Newest ${filter.key === "all" ? "" : filter.label.toLowerCase() + " "}openings`}
        </p>
        <SectionTabs tab={tab} onChange={selectTab} />
      </div>
      <div className="flex-1">
        {busy ? (
          Array.from({ length: 6 }).map((_, i) => <HomeRowSkeleton key={i} />)
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">No {filter.key === "all" ? "" : filter.label.toLowerCase() + " "}openings right now</p>
            <Link href={filter.href} className="text-xs font-semibold text-[var(--hs-trust)] hover:underline">
              Browse all private jobs
            </Link>
          </div>
        ) : (
          jobs.map((job) => <HomePrivateJobRow key={job.id} job={job} />)
        )}
      </div>
    </>
  )
}

/** Private jobs panel — right half of the home jobs hub, with quick sub-filters. */
export function LatestPrivateJobs({ className }: { className?: string }) {
  const [filterKey, setFilterKey] = useState<FilterKey>("all")
  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0]
  const stats = useSiteStats()

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div className="flex flex-wrap items-end gap-3 border-b-2 border-[var(--color-ink)]/80 pb-2">
        <div className="min-w-[9rem] flex-1">
          <h3 className="font-display text-[1.35rem] font-bold leading-tight text-foreground">
            <Building2 className="mr-1.5 inline h-[18px] w-[18px] -translate-y-0.5" aria-hidden />
            Situations vacant
          </h3>
          <p className="truncate text-[12px] italic text-muted-foreground">
            {stats ? `${formatCompact(stats.totalPrivateJobs)} openings from verified companies` : "Private companies hiring now"}
          </p>
        </div>
        <Link href="/private-jobs/refer" className="text-[12px] italic text-muted-foreground underline decoration-[var(--hs-border-strong)] underline-offset-4 hover:text-foreground">
          Refer a job
        </Link>
      </div>

      {/* classified sub-headings */}
      <div className="hs-scroll mt-3 flex gap-1 overflow-x-auto" role="tablist" aria-label="Filter private jobs">
        {FILTERS.map((f) => {
          const on = f.key === filterKey
          return (
            <button
              key={f.key}
              role="tab"
              aria-selected={on}
              onClick={() => setFilterKey(f.key)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-[2px] px-2.5 py-1 text-[12px] font-semibold transition-colors",
                on ? "bg-[var(--color-ink)] text-[var(--color-paper)]" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <PrivateJobsFeed key={filter.key} filter={filter} />

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[var(--hs-border-strong)] pt-3 text-[12.5px]">
        <span className="italic text-muted-foreground">Hand-picked from company career pages</span>
        <Link href={filter.href} className="group ml-auto inline-flex items-center gap-1 font-semibold text-[var(--hs-trust)]">
          More {filter.key === "all" ? "private" : filter.label.toLowerCase()} jobs
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
