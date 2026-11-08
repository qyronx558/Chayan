"use client"

import Link from "next/link"
import { ArrowRight, Calendar } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { SectionHeader } from "@/components/ui/section-header"
import { UniversalCard, UniversalCardSkeleton } from "@/components/ui/universal-card"
import { CardShareButton } from "@/components/ui/card-actions"
import { ApplicationTracker } from "@/components/jobs/ApplicationTracker"
import { moduleTheme } from "@/components/ui/module-theme"
import { SectionTabs } from "@/components/home/SectionTabs"
import { useHomeSection } from "@/components/home/use-home-section"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"

interface AdmissionItem {
 id: string
 title: string
 department: string
 description?: string | null
 lastDate?: string | null
 slug: string
}

const toItem = (item: Record<string, unknown>): AdmissionItem => ({
 id: item.id as string,
 title: item.title as string,
 department: (item.department as { name: string })?.name ?? "",
 description: item.description as string | null | undefined,
 lastDate: (item.lastDate as string | null | undefined) ?? null,
 slug: item.slug as string,
})

export function LatestAdmissions() {
 const { latest, trending, trendingMeta, tab, selectTab, loading, trendingLoading } = useHomeSection(
  "/api/admissions?limit=6",
  "/api/admissions?limit=6&sort=trending"
 )

 const items = filterValidItems(((tab === "trending" ? trending : latest) ?? []).map(toItem))
 const busy = tab === "trending" ? trendingLoading && trending === null : loading
 const theme = moduleTheme.admission

 if (!busy && items.length === 0) return null

 return (
  <section className={cn("py-16")}>
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeader
     icon={theme.icon}
     iconClassName={theme.iconBg}
     title="Latest Admissions"
     subtitle={
      tab === "trending" && trendingMeta && !trendingMeta.fallback
       ? `Most viewed over the last ${trendingMeta.windowDays} days`
       : "College and course admission notifications"
     }
     viewAllHref="/admissions"
     action={<SectionTabs tab={tab} onChange={selectTab} />}
    />

    {busy ? (
     <div className={theme.homeGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
       <UniversalCardSkeleton key={i} />
      ))}
     </div>
    ) : (
     <div className={theme.homeGrid}>
      {items.map((item) => (
       <div key={item.id} className="relative h-full">
        <UniversalCard
         module="admission"
         title={cleanTitle(item.title)}
         organization={item.department}
         description={item.description}
         metadata={item.lastDate ? [{ icon: Calendar, text: `Last Date: ${formatDate(item.lastDate)}` }] : []}
         primaryCtaUrl={`/admission/${item.slug}`}
         track={<ApplicationTracker jobId={item.id} type="admission" />}
         share={<CardShareButton title={cleanTitle(item.title)} url={`/admission/${item.slug}`} />}
        />
       </div>
      ))}
     </div>
    )}

    <div className="mt-6 text-center sm:hidden">
     <Link
      href="/admissions"
      className="inline-flex items-center gap-1 text-sm font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2"
     >
      View All Admissions
      <ArrowRight className="h-4 w-4" />
     </Link>
    </div>
   </div>
  </section>
 )
}
