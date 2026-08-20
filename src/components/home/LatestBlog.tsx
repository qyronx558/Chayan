import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { Newspaper, Calendar, Clock3 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "@/components/ui/section-header"
import { ContentCard } from "@/components/ui/content-card"

const readingTime = (content?: string | null): number => {
  if (!content) return 2
  return Math.max(1, Math.round(content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length / 200))
}

export async function LatestBlog() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { category: true },
  })

  if (posts.length === 0) return null

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
        icon={Newspaper}
        iconClassName="from-amber-500 to-orange-700"
        title="From the Blog"
        subtitle="Guides, updates and preparation tips"
        viewAllHref="/blog"
        viewAllLabel="View All Articles"
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {posts.map((post) => (
          <ContentCard
            key={post.id}
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
            ]}
            href={`/blog/${post.slug}`}
            ctaLabel="Read More"
          />
        ))}
      </div>
      </div>
    </section>
  )
}