"use client"

import Link from "next/link"
import { ArrowRight, Download, Calendar, FileText, Flame } from "lucide-react"
import { BookmarkButton } from "@/components/layout/BookmarkButton"
import { cn, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/components/ui/section-header"
import { ContentCard, ContentCardSkeleton } from "@/components/ui/content-card"
import { SectionTabs } from "@/components/home/SectionTabs"
import { useHomeSection } from "@/components/home/use-home-section"

interface AdmitCard {
  id: string
  title: string
  department: string
  examDate?: string
  downloadUrl?: string
  slug: string
}

const toCard = (item: Record<string, unknown>): AdmitCard => ({
  id: item.id as string,
  title: item.title as string,
  department: (item.department as { name: string })?.name ?? "",
  examDate: item.examDate as string | undefined,
  downloadUrl: item.downloadUrl as string | undefined,
  slug: item.slug as string,
})

export function LatestAdmitCards() {
  const { latest, trending, trendingMeta, tab, selectTab, loading, trendingLoading } = useHomeSection(
    "/api/admit-cards?limit=9",
    "/api/admit-cards?limit=9&sort=trending"
  )

  const admitCards = ((tab === "trending" ? trending : latest) ?? []).map(toCard)
  const busy = tab === "trending" ? trendingLoading && trending === null : loading

  return (
    <section className={cn("py-16")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          icon={FileText}
          iconClassName="from-violet-600 to-purple-800"
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : admitCards.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No admit cards released yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {admitCards.map((card) => (
              <div key={card.id} className="relative">
                {tab === "trending" && (
                  <span className="absolute -top-2.5 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    <Flame className="h-3 w-3" /> Trending
                  </span>
                )}
                <ContentCard
                  icon={FileText}
                  iconClassName="from-violet-600 to-purple-800"
                  badge={<Badge variant="secondary" className="max-w-[65%] truncate bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{card.department}</Badge>}
                  statusBadge={<span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">Admit Card</span>}
                  title={card.title}
                  meta={card.examDate ? [{ icon: Calendar, text: `Exam: ${formatDate(card.examDate)}` }] : []}
                  href={`/admit-card/${card.slug}`}
                  ctaLabel="Get Admit Card"
                  footer={
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <BookmarkButton admitCardId={card.id} className="h-8 w-8 border border-gray-200 bg-white text-gray-500 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600" />
                      <Button size="sm" className="h-8 shrink-0 gap-1.5 px-3 text-xs font-semibold" asChild>
                        <a href={card.downloadUrl || `/admit-card/${card.slug}`} target={card.downloadUrl ? "_blank" : undefined} rel="noopener noreferrer">
                          <Download className="h-3.5 w-3.5" />
                          Download Admit Card
                        </a>
                      </Button>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/admit-cards"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All Admit Cards
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
