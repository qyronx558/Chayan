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

interface AdmitCard {
 id: string
 title: string
 department: string
 examDate?: string
 slug: string
}

const toCard = (item: Record<string, unknown>): AdmitCard => ({
 id: item.id as string,
 title: item.title as string,
 department: (item.department as { name: string })?.name ?? "",
 examDate: item.examDate as string | undefined,
 slug: item.slug as string,
})

export function LatestAdmitCards() {
 const { latest, trending, trendingMeta, tab, selectTab, loading, trendingLoading } = useHomeSection(
  "/api/admit-cards?limit=9",
  "/api/admit-cards?limit=9&sort=trending"
 )

 const admitCards = filterValidItems(((tab === "trending" ? trending : latest) ?? []).map(toCard))
 const busy = tab === "trending" ? trendingLoading && trending === null : loading
 const theme = moduleTheme.admitCard

 return (
  <section className={cn("py-16")}>
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeader
     icon={theme.icon}
     iconClassName={theme.iconBg}
     title="Latest Admit Cards"
     subtitle={
      tab === "trending" && trendingMeta && !trendingMeta.fallback
       ? `Most viewed over the last ${trendingMeta.windowDays} days`
       : "Download your examination hall tickets"
     }
     viewAllHref="/admit-cards"
     action={<SectionTabs tab={tab} onChange={selectTab} />}
    />

    {busy ? (
     <div className={theme.homeGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
       <UniversalCardSkeleton key={i} />
      ))}
     </div>
    ) : admitCards.length === 0 ? (
     <UniversalCardEmpty title="No admit cards released yet" hint="Hall tickets will appear here as soon as they are released." />
    ) : (
     <div className={theme.homeGrid}>
      {admitCards.map((card) => (
       <div key={card.id} className="relative h-full">
        <UniversalCard
         module="admitCard"
         title={cleanTitle(card.title)}
         organization={card.department}
         metadata={card.examDate ? [{ icon: Calendar, text: `Exam: ${formatDate(card.examDate)}` }] : []}
         primaryCtaUrl={`/admit-card/${card.slug}`}
         save={<BookmarkButton admitCardId={card.id} />}
         share={<CardShareButton title={cleanTitle(card.title)} url={`/admit-card/${card.slug}`} />}
        />
       </div>
      ))}
     </div>
    )}

    <div className="mt-6 text-center sm:hidden">
     <Link
      href="/admit-cards"
      className="inline-flex items-center gap-1 text-sm font-medium text-brick underline decoration-1 underline-offset-4 hover:decoration-2"
     >
      View All Admit Cards
      <ArrowRight className="h-4 w-4" />
     </Link>
    </div>
   </div>
  </section>
 )
}
