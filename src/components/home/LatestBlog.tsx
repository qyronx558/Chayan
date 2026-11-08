"use client"

import { formatDate } from "@/lib/utils"
import { Calendar, Clock3, Eye } from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { UniversalCard, UniversalCardSkeleton } from "@/components/ui/universal-card"
import { CardShareButton } from "@/components/ui/card-actions"
import { moduleTheme } from "@/components/ui/module-theme"
import { SectionTabs } from "@/components/home/SectionTabs"
import { useHomeSection } from "@/components/home/use-home-section"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"

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

 const posts = filterValidItems(((tab === "trending" ? trending : latest) ?? []).map(toPost))
 const busy = tab === "trending" ? trendingLoading && trending === null : loading
 const theme = moduleTheme.blog

 if (!busy && posts.length === 0) return null

 return (
  <section className="py-16">
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <SectionHeader
     icon={theme.icon}
     iconClassName={theme.iconBg}
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
     <div className={theme.homeGrid}>
      {Array.from({ length: 8 }).map((_, i) => (
       <UniversalCardSkeleton key={i} />
      ))}
     </div>
    ) : (
     <div className={theme.homeGrid}>
      {posts.map((post) => (
       <div key={post.id} className="relative h-full">
        <UniversalCard
         module="blog"
         title={cleanTitle(post.title)}
         organization={post.category?.name}
         description={post.excerpt}
         metadata={[
          { icon: Calendar, text: formatDate(post.createdAt) },
          { icon: Clock3, text: `${readingTime(post.content)} min read` },
          ...(typeof post.views === "number" && post.views > 0
           ? [{ icon: Eye, text: `${post.views.toLocaleString("en-IN")} views` }]
           : []),
         ]}
         primaryCtaUrl={`/blog/${post.slug}`}
         share={<CardShareButton title={cleanTitle(post.title)} url={`/blog/${post.slug}`} />}
        />
       </div>
      ))}
     </div>
    )}
   </div>
  </section>
 )
}
