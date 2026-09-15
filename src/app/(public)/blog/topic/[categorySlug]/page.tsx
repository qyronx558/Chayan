import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { formatCompact, formatDate, getBaseUrl } from "@/lib/utils"
import { getReadingTimeMinutes } from "@/lib/blog-prose"
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav"
import { FileText, FolderOpen, Eye, Clock3, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const revalidate = 1800

interface PageProps {
  params: Promise<{ categorySlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params
  const category = await prisma.blogCategory.findUnique({ where: { slug: categorySlug } })
  if (!category) return { title: "Category Not Found" }

  const baseUrl = getBaseUrl()
  return {
    title: `${category.name} Articles & Guides | Chayan Blog`,
    description: category.description || `${category.name} articles, guides and resources on Chayan.`,
    alternates: { canonical: `${baseUrl}/blog/topic/${category.slug}` },
    openGraph: { title: `${category.name} | Chayan Blog`, description: category.description || undefined },
  }
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { categorySlug } = await params
  const category = await prisma.blogCategory.findUnique({
    where: { slug: categorySlug },
    include: { posts: { where: { published: true }, orderBy: { createdAt: "desc" }, take: 24, select: { id: true, title: true, slug: true, excerpt: true, image: true, content: true, views: true, createdAt: true } } },
  })

  if (!category) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: `${getBaseUrl()}/blog/topic/${category.slug}`,
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <BreadcrumbNav
        segments={[
          { label: "Blog", href: "/blog" },
          { label: category.name, href: `/blog/topic/${category.slug}` },
        ]}
        className="mb-6"
      />
<header className="relative mb-8 overflow-hidden rounded-2xl border-t-2 border-[#B08D57] bg-[#101E33] p-6 text-white shadow-lg sm:p-8">
        <div className="relative flex flex-wrap items-center gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <FolderOpen className="h-8 w-8 text-[#E8C87A]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge className="bg-[#B08D57] font-semibold text-[#1A1408]">Category</Badge>
              <Badge className="bg-white/10 text-slate-200">{category.posts.length} articles</Badge>
            </div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#F7F3E8] sm:text-3xl">{category.name}</h1>
            <p className="mt-1 text-sm text-slate-300 sm:text-base">{category.description}</p>
          </div>
        </div>
      </header>

      {category.posts.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {category.posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:-translate-y-0.5 hover:border-[#B08D57]/60 hover:shadow-lg hover:shadow-[#E5DCC8]/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700 dark:hover:shadow-none"
            >
              {p.image && (
                <span className="relative block aspect-video w-full overflow-hidden bg-gray-100">
                  <Image src={p.image} alt={p.title} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </span>
              )}
              <span className="block p-5">
                <Badge variant="secondary" className="mb-2 text-xs">{category.name}</Badge>
                <span className="line-clamp-2 block text-base font-semibold leading-snug text-gray-900 group-hover:text-[#1B3A5C] dark:text-gray-100 dark:group-hover:text-blue-300">
                  {p.title}
                </span>
                {p.excerpt && <span className="mt-2 line-clamp-2 block text-sm text-gray-600 dark:text-gray-400">{p.excerpt}</span>}
                <span className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(p.createdAt)}</span>
                  <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {getReadingTimeMinutes(p.content)} min</span>
                  <span className="flex items-center gap-1" title={`${p.views.toLocaleString("en-IN")} views`}><Eye className="h-3.5 w-3.5" /> {formatCompact(p.views)}</span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h2 className="mb-2 text-lg font-semibold text-gray-900">No articles yet</h2>
          <p className="text-sm text-gray-500">New {category.name} articles are being written. Check back soon.</p>
        </div>
      )}
<div className="mt-6 text-center">
        <Link href="/blog" className="text-sm font-semibold text-[#1B3A5C] hover:text-[#101E33] dark:text-blue-400">
          View all blog categories â†’
        </Link>
      </div>
    </div>
  )
}