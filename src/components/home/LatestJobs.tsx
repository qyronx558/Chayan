"use client"

import Link from "next/link"
import { ArrowRight, Briefcase, Landmark } from "lucide-react"
import { cn, formatCompact } from "@/lib/utils"
import { SectionTabs } from "@/components/home/SectionTabs"
import { useHomeSection } from "@/components/home/use-home-section"
import { useSiteStats } from "@/components/home/use-site-stats"
import { HomeJobRow, HomeRowSkeleton, type HomeJobRowProps } from "@/components/home/HomeJobRow"
import { filterValidItems } from "@/lib/card-helpers"

const toJob = (job: Record<string, unknown>): HomeJobRowProps & { id: string } => ({
  id: job.id as string,
  title: job.title as string,
  slug: job.slug as string,
  department: (job.department as { name: string })?.name ?? "",
  location: (job.location as string) ?? null,
  totalVacancies: (job.totalVacancies as number) ?? null,
  lastDateToApply: (job.lastDate as string) ?? null,
})

const LINKS = [
  { label: "Jobs by state", href: "/jobs/states" },
  { label: "Exam calendar", href: "/exam-calendar" },
]

/** Government jobs panel — left half of the home jobs hub. */
export function LatestJobs({ className }: { className?: string }) {
  const { latest, trending, trendingMeta, tab, selectTab, loading, trendingLoading } = useHomeSection(
    "/api/jobs?limit=7&status=ACTIVE",
    "/api/jobs?limit=7&status=ACTIVE&sort=trending"
  )
  const stats = useSiteStats()

  const jobs = filterValidItems(((tab === "trending" ? trending : latest) ?? []).map(toJob)).slice(0, 7)
  const busy = tab === "trending" ? trendingLoading && trending === null : loading

  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <div className="flex flex-wrap items-end gap-3 border-b-2 border-[var(--color-ink)]/80 pb-2">
        <div className="min-w-[9rem] flex-1">
          <h3 className="font-display text-[1.35rem] font-bold leading-tight text-foreground">
            <Landmark className="mr-1.5 inline h-[18px] w-[18px] -translate-y-0.5" aria-hidden />
            Government notifications
          </h3>
          <p className="truncate text-[12px] italic text-muted-foreground">
            {tab === "trending" && trendingMeta && !trendingMeta.fallback
              ? `Most read over the last ${trendingMeta.windowDays} days`
              : stats
                ? `${formatCompact(stats.activeJobs)} notices open across India`
                : "Central & state notifications"}
          </p>
        </div>
        <SectionTabs tab={tab} onChange={selectTab} />
      </div>

      <div className="flex-1">
        {busy ? (
          Array.from({ length: 6 }).map((_, i) => <HomeRowSkeleton key={i} />)
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Briefcase className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">No government notices in this edition</p>
            <p className="text-xs text-muted-foreground">New notifications appear here as soon as they are published.</p>
          </div>
        ) : (
          jobs.map(({ id, ...job }) => <HomeJobRow key={id} {...job} />)
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--hs-border-strong)] pt-3 text-[12.5px]">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="italic text-muted-foreground underline decoration-[var(--hs-border-strong)] underline-offset-4 hover:text-foreground">
            {l.label}
          </Link>
        ))}
        <Link href="/jobs" className="group ml-auto inline-flex items-center gap-1 font-semibold text-[var(--hs-trust)]">
          Continued on /jobs
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
