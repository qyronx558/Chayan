"use client"

import Link from "next/link"
import { ArrowRight, KeyRound, Calendar, Flame } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "@/components/ui/section-header"
import { ContentCard, ContentCardSkeleton } from "@/components/ui/content-card"
import { SectionTabs } from "@/components/home/SectionTabs"
import { useHomeSection } from "@/components/home/use-home-section"

interface AnswerKeyItem {
  id: string
  title: string
  department: string
  description?: string | null
  createdAt: string
  slug: string
}

const toItem = (item: Record<string, unknown>): AnswerKeyItem => ({
  id: item.id as string,
  title: item.title as string,
  department: (item.department as { name: string })?.name ?? "",
  description: item.description as string | null | undefined,
  createdAt: item.createdAt as string,
  slug: item.slug as string,
})

export function LatestAnswerKeys() {
  const { latest, trending, trendingMeta, tab, selectTab, loading, trendingLoading } = useHomeSection(
    "/api/answer-keys?limit=6",
    "/api/answer-keys?limit=6&sort=trending"
  )

  const items = ((tab === "trending" ? trending : latest) ?? []).map(toItem)
  const busy = tab === "trending" ? trendingLoading && trending === null : loading

  if (!busy && items.length === 0) return null

  return (
    <section className={cn("py-16")}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          icon={KeyRound}
          iconClassName="from-cyan-600 to-sky-800"
          title="Latest Answer Keys"
          subtitle={
            tab === "trending" && trendingMeta && !trendingMeta.fallback
              ? `Most viewed over the last ${trendingMeta.windowDays} days`
              : "Provisional and final answer keys"
          }
          viewAllHref="/answer-keys"
          action={<SectionTabs tab={tab} onChange={selectTab} />}
        />

        {busy ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id} className="relative">
                {tab === "trending" && (
                  <span className="absolute -top-2.5 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    <Flame className="h-3 w-3" /> Trending
                  </span>
                )}
                <ContentCard
                  icon={KeyRound}
                  iconClassName="from-cyan-600 to-sky-800"
                  badge={<Badge variant="secondary" className="max-w-[65%] truncate bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600">{item.department}</Badge>}
                  statusBadge={<span className="inline-flex items-center rounded-full bg-cyan-100 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">Answer Key</span>}
                  title={item.title}
                  description={item.description}
                  meta={[{ icon: Calendar, text: `Published: ${formatDate(item.createdAt)}` }]}
                  href={`/answer-key/${item.slug}`}
                  ctaLabel="View Answer Key"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/answer-keys"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All Answer Keys
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
