"use client"

import { formatDate } from "@/lib/utils"
import { Newspaper, Calendar, Clock3, Flame, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "@/components/ui/section-header"
import { ContentCard, ContentCardSkeleton } from "@/components/ui/content-card"
import { SectionTabs } from "@/components/home/SectionTabs"
import { useHomeSection } from "@/components/home/use-home-section"

const readingTime = (content?: string | null): number => {
  if (!content) return 2
  return Math.max(1, Math.round(content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length / 200))
}

interface BlogItem {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  views?: number
  createdAt: string
  category?: { name: string } | null
}

const toPost = (item: Record<string, unknown>): BlogItem => ({
  id: item.id as string,
  title: item.title as string,
  slug: item.slug as string,
  excerpt: item.excerpt as string | null | undefined,
  content: item.content as string | null | undefined,
  views: item.views as number | undefined,
  createdAt: item.createdAt as string,
  category: item.category as { name: string } | null | undefined,
})

export function LatestBlog() {
  const { latest, trending, trendingMeta, tab, selectTab, loading, trendingLoading } = useHomeSection(
    "/api/blog?limit=8",
    "/api/blog?limit=8&sort=trending"
  )

  const posts = ((tab === "trending" ? trending : latest) ?? []).map(toPost)
  const busy = tab === "trending" ? trendingLoading && trending === null : loading

  if (!busy && posts.length === 0) return null

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          icon={Newspaper}
          iconClassName="from-amber-500 to-orange-700"
          title="From the Blog"
          subtitle={
            tab === "trending" && trendingMeta && !trendingMeta.fallback
              ? `Most read over the last ${trendingMeta.windowDays} days`
              : "Guides, updates and preparation tips"
          }
          viewAllHref="/blog"
          viewAllLabel="View All Articles"
          action={<SectionTabs tab={tab} onChange={selectTab} />}
        />

        {busy ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <div key={post.id} className="relative">
                {tab === "trending" && (
                  <span className="absolute -top-2.5 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    <Flame className="h-3 w-3" /> Trending
                  </span>
                )}
                <ContentCard
                  icon={Newspaper}
                  iconClassName="from-amber-500 to-orange-700"
                  badge={
                    post.category ? (
                      <Badge variant="secondary" className="max-w-[65%] truncate bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                        {post.category.name}
                      </Badge>
                    ) : undefined
                  }
                  statusBadge={
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      Article
                    </span>
                  }
                  title={post.title}
                  description={post.excerpt}
                  meta={[
                    { icon: Calendar, text: formatDate(post.createdAt) },
                    { icon: Clock3, text: `${readingTime(post.content)} min read` },
                    ...(typeof post.views === "number" && post.views > 0
                      ? [{ icon: Eye, text: `${post.views.toLocaleString("en-IN")} views` }]
                      : []),
                  ]}
                  href={`/blog/${post.slug}`}
                  ctaLabel="Read More"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
