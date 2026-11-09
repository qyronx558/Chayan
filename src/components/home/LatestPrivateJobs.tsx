"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/ui/section-header"
import { UniversalCardSkeleton, UniversalCardEmpty } from "@/components/ui/universal-card"
import { PrivateJobCard } from "@/components/private/PrivateJobCard"
import { moduleTheme } from "@/components/ui/module-theme"
import { SectionTabs } from "@/components/home/SectionTabs"
import { useHomeSection } from "@/components/home/use-home-section"
import { filterValidItems } from "@/lib/card-helpers"

interface Company {
 id: string
 name: string
 slug: string
 logo?: string | null
}

interface PrivateJob {
 id: string
 title: string
 slug: string
 type: string
 category?: string | null
 description?: string | null
 location?: string | null
 salary?: string | null
 salaryMin?: number | null
 salaryMax?: number | null
 experience?: string | null
 remotePolicy?: string | null
 isFresherFriendly?: boolean
 isWalkIn?: boolean
 status: string
 createdAt: string
 company: Company
}

const typeLabels: Record<string, string> = {
 FULL_TIME: "Full-Time",
 PART_TIME: "Part-Time",
 INTERNSHIP: "Internship",
 CONTRACT: "Contract",
}

export function LatestPrivateJobs({ className }: { className?: string }) {
 const { latest, trending, trendingMeta, tab, selectTab, loading, trendingLoading } = useHomeSection(
  "/api/private-jobs?limit=8&status=ACTIVE",
  "/api/private-jobs?limit=8&status=ACTIVE&sort=trending"
 )
 const [showAll, setShowAll] = useState(false)

 const jobs = filterValidItems(((tab === "trending" ? trending : latest) ?? []) as unknown as PrivateJob[])
 const busy = tab === "trending" ? trendingLoading && trending === null : loading
 const displayed = showAll ? jobs : jobs.slice(0, 4)
 const theme = moduleTheme.privateJob

 return (
  <section className={cn("py-12 sm:py-16", className)}>
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeader
     icon={theme.icon}
     iconClassName={theme.iconBg}
     index="04"
     title="Latest Private Jobs"
     subtitle={
      tab === "trending" && trendingMeta && !trendingMeta.fallback
       ? `Most viewed over the last ${trendingMeta.windowDays} days`
       : "Top opportunities from leading companies"
     }
     viewAllHref="/private-jobs"
     action={<SectionTabs tab={tab} onChange={(t) => { selectTab(t); setShowAll(false) }} />}
    />

    {busy ? (
     <div className={theme.homeGrid}>
      {Array.from({ length: 4 }).map((_, i) => (
       <UniversalCardSkeleton key={i} />
      ))}
     </div>
    ) : jobs.length === 0 ? (
     <UniversalCardEmpty title="No private jobs right now" hint="New openings from verified companies will appear here." />
    ) : (
     <div className={theme.homeGrid}>
      {displayed.map((job) => (
       <div key={job.id} className="relative h-full">
        <PrivateJobCard
         id={job.id}
         title={job.title}
         slug={job.slug}
         company={job.company.name}
         type={job.type}
         typeLabel={typeLabels[job.type] || job.type?.replace("_", " ")}
         location={job.location}
         remotePolicy={job.remotePolicy}
         salary={job.salary}
         salaryMin={job.salaryMin}
         salaryMax={job.salaryMax}
         experience={job.experience}
         isFresherFriendly={job.isFresherFriendly}
         isWalkIn={job.isWalkIn}
         status={job.status}
         variant="wide"
        />
       </div>
      ))}
     </div>
    )}

    {jobs.length > 4 && (
     <div className="mt-6 text-center">
      <Button variant="outline" onClick={() => setShowAll(!showAll)} className="gap-2">
       {showAll ? (
        <>Show Less <ChevronUp className="h-4 w-4" /></>
       ) : (
        <>Load More ({jobs.length - 4} more) <ChevronDown className="h-4 w-4" /></>
       )}
      </Button>
     </div>
    )}

    <div className="mt-6 text-center sm:hidden">
     <Link href="/private-jobs" className="inline-flex items-center gap-1 text-sm font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2">
      View All Private Jobs
      <ArrowRight className="h-4 w-4" />
     </Link>
    </div>
   </div>
  </section>
 )
}
