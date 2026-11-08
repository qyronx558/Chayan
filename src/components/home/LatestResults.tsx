"use client"

import Link from "next/link"
import { ArrowRight, Calendar } from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { cn, formatDate } from "@/lib/utils"
import { SectionHeader } from "@/components/ui/section-header"
import { UniversalCard, UniversalCardSkeleton, UniversalCardEmpty } from "@/components/ui/universal-card"
import { CardShareButton } from "@/components/ui/card-actions"
import { moduleTheme } from "@/components/ui/module-theme"
import { SectionTabs } from "@/components/home/SectionTabs"
import { useHomeSection } from "@/components/home/use-home-section"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"

interface Result {
 id: string
 title: string
 department: string
 resultDate: string
 createdAt: string
 description?: string | null
 slug: string
}

const toResult = (item: Record<string, unknown>): Result => ({
 id: item.id as string,
 title: item.title as string,
 department: (item.department as { name: string })?.name ?? "",
 resultDate: item.resultDate as string,
 createdAt: item.createdAt as string,
 description: item.description as string | null | undefined,
 slug: item.slug as string,
})

export function LatestResults() {
 const { latest, trending, trendingMeta, tab, selectTab, loading, trendingLoading } = useHomeSection(
  "/api/results?limit=9",
  "/api/results?limit=9&sort=trending"
 )

 const results = filterValidItems(((tab === "trending" ? trending : latest) ?? []).map(toResult))
 const busy = tab === "trending" ? trendingLoading && trending === null : loading
 const theme = moduleTheme.result

 return (
  <section className={cn("py-16")}>
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeader
     icon={theme.icon}
     iconClassName={theme.iconBg}
     title="Latest Results"
     subtitle={
      tab === "trending" && trendingMeta && !trendingMeta.fallback
       ? `Most viewed over the last ${trendingMeta.windowDays} days`
       : "Recently published examination results"
     }
     viewAllHref="/results"
     action={<SectionTabs tab={tab} onChange={selectTab} />}
    />

    {busy ? (
     <div className={theme.homeGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
       <UniversalCardSkeleton key={i} />
      ))}
     </div>
    ) : results.length === 0 ? (
     <UniversalCardEmpty title="No results published yet" hint="Check back soon for newly declared examination results." />
    ) : (
     <div className={theme.homeGrid}>
      {results.map((result) => (
       <div key={result.id} className="relative h-full">
        <UniversalCard
         module="result"
         title={cleanTitle(result.title)}
         organization={result.department}
         description={result.description}
         metadata={[
          {
           icon: Calendar,
           text: result.resultDate
            ? `Result: ${formatDate(result.resultDate)}`
            : `Released: ${formatDate(result.createdAt)}`,
          },
         ]}
         primaryCtaUrl={`/result/${result.slug}`}
         save={<BookmarkButton resultId={result.id} />}
         share={<CardShareButton title={cleanTitle(result.title)} url={`/result/${result.slug}`} />}
        />
       </div>
      ))}
     </div>
    )}

    <div className="mt-6 text-center sm:hidden">
     <Link
      href="/results"
      className="inline-flex items-center gap-1 text-sm font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2"
     >
      View All Results
      <ArrowRight className="h-4 w-4" />
     </Link>
    </div>
   </div>
  </section>
 )
}
