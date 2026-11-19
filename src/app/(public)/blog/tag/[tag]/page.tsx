import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { formatCompact, formatDate, getBaseUrl, safeJsonLd } from "@/lib/utils"
import { getReadingTimeMinutes } from "@/lib/blog-prose"
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav"
import { Badge } from "@/components/ui/badge"
import { Tag, Eye, Clock3, Calendar } from "lucide-react"

export const revalidate = 86400

export function generateStaticParams(): Record<string, string>[] {
  return []
}

interface PageProps {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params
  const baseUrl = getBaseUrl()
  const label = tag.replace(/-/g, " ")
  return {
    title: `${label.charAt(0).toUpperCase() + label.slice(1)} Articles | ChayanJobs Blog`,
    description: `Articles tagged "${label}" on ChayanJobs Blog.`,
    alternates: { canonical: `${baseUrl}/blog/tag/${tag}` },
  }
}

export default async function BlogTagPage({ params }: PageProps) {
  const { tag } = await params

  const posts = await prisma.blogPost.findMany({
    where: { published: true, tags: { contains: tag } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { category: true },
  })

  if (posts.length === 0) notFound()

  const label = tag.replace(/-/g, " ")

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: label,
    url: `${getBaseUrl()}/blog/tag/${tag}`,
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <BreadcrumbNav
        segments={[
          { label: "Blog", href: "/blog" },
          { label: `Tag: ${label}`, href: `/blog/tag/${tag}` },
        ]}
        className="mb-6"
      />
<header className="mb-8 flex items-center gap-4 border-b-2 border-[#B08D57] pb-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101E33]">
          <Tag className="h-6 w-6 text-[#E8C87A]" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-foreground capitalize dark:text-paper">{label}</h1>
          <p className="text-sm text-muted-foreground">{posts.length} articles</p>
        </div>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {posts.map((p) => (
          <Link
            key={p.id}
            href={`/blog/${p.slug}`}
            className="group overflow-hidden rounded-xl border border-rule bg-background transition-all hover:-translate-y-0.5 hover:border-[#B08D57]/60 hover:/50 dark:border-ink dark:bg-ink dark:hover:border-rule dark:hover:"
          >
            {p.image && (
              <span className="relative block aspect-video w-full overflow-hidden bg-paper-3">
                <Image src={p.image} alt={p.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </span>
            )}
            <span className="block p-5">
              {p.category && <Badge variant="secondary" className="mb-2 text-xs">{p.category.name}</Badge>}
              <span className="line-clamp-2 block text-base font-semibold leading-snug text-foreground group-hover:text-[#1B3A5C] dark:text-paper dark:group-hover:text-brick">
                {p.title}
              </span>
              {p.excerpt && <span className="mt-2 line-clamp-2 block text-sm text-muted-foreground dark:text-muted-foreground">{p.excerpt}</span>}
              <span className="mt-3 flex items-center gap-3 text-xs text-muted-foreground dark:text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(p.createdAt)}</span>
                <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {getReadingTimeMinutes(p.content)} min</span>
                <span className="flex items-center gap-1" title={`${p.views.toLocaleString("en-IN")} views`}><Eye className="h-3.5 w-3.5" /> {formatCompact(p.views)}</span>
              </span>
            </span>
          </Link>
        ))}
      </div>
</div>
  )
}