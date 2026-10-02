import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { formatCompact, formatDate, getBaseUrl, timeAgo } from "@/lib/utils"
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Eye, Clock3, Tag, FileText, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react"
import { PrintButton } from "@/components/blog/PrintButton"
import { ShareButtons } from "@/components/blog/ShareButtons"
import { ShareRail } from "@/components/blog/ShareRail"
import { ViewTracker } from "@/components/blog/ViewTracker"
import { ReadingProgress } from "@/components/blog/ReadingProgress"
import { TableOfContents } from "@/components/blog/TableOfContents"
import { BLOG_PROSE_CLASSES, prepareArticleHtml, getReadingTimeMinutes, extractTakeaways, extractFaq } from "@/lib/blog-prose"
import { AuthorCard } from "@/components/blog/AuthorCard"
import { KeyTakeaways } from "@/components/blog/KeyTakeaways"
import { FaqBlock } from "@/components/blog/FaqBlock"
import { SaveButton } from "@/components/blog/SaveButton"
import { RelatedJobs } from "@/components/blog/RelatedJobs"
import { DiscussionSection } from "@/components/discussion/DiscussionSection"
import { NewsletterCTA } from "@/components/blog/NewsletterCTA"

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true },
      orderBy: { views: "desc" },
      take: 50,
    })
    return posts.map((p) => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({ where: { slug }, include: { category: true } })
  if (!post) return { title: "Post Not Found" }

  const baseUrl = getBaseUrl()
  const keywords = post.tags ? post.tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined
  const ogImage = `${baseUrl}/blog/${post.slug}/opengraph-image`
  return {
    title: post.title,
    description: post.excerpt || post.title,
    keywords,
    alternates: { canonical: `${baseUrl}/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      section: post.category?.name,
      tags: keywords,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | ChayanJobs Blog`,
      description: post.excerpt || post.title,
      images: [ogImage],
    },
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { category: true },
  })
  if (!post || !post.published) notFound()

  const [relatedPosts, prevPost, nextPost] = await Promise.all([
    prisma.blogPost.findMany({
      where: post.categoryId
        ? { id: { not: post.id }, published: true, categoryId: post.categoryId }
        : { id: { not: post.id }, published: true },
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, slug: true, excerpt: true, image: true, views: true, createdAt: true, content: true },
    }),
    prisma.blogPost.findFirst({
      where: { published: true, createdAt: { lt: post.createdAt } },
      orderBy: { createdAt: "desc" },
      select: { title: true, slug: true },
    }),
    prisma.blogPost.findFirst({
      where: { published: true, createdAt: { gt: post.createdAt } },
      orderBy: { createdAt: "asc" },
      select: { title: true, slug: true },
    }),
  ])

  const baseUrl = getBaseUrl()
  const breadCrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${baseUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${baseUrl}/blog/${post.slug}` },
    ],
  }

  const tags = post.tags ? post.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
  const readingTime = getReadingTimeMinutes(post.content)
  const articleHtml = prepareArticleHtml(post.content)
  const takeaways = extractTakeaways(post.excerpt, post.content, 3)
  const faqs = extractFaq(post.content, 4)
  const authorName = post.author || "ChayanJobs Team"
  const wordCount = post.content ? post.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length : 0
  const postUrl = `${baseUrl}/blog/${post.slug}`

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    keywords: post.tags || undefined,
    articleSection: post.category?.name,
    wordCount,
    timeRequired: `PT${readingTime}M`,
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    image: post.image ? [post.image, `${postUrl}/opengraph-image`] : [`${postUrl}/opengraph-image`],
    author: { "@type": "Person", name: authorName },
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    publisher: { "@type": "Organization", name: "ChayanJobs", logo: { "@type": "ImageObject", url: `${baseUrl}/icon.svg` } },
  }

  const faqLd = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  } : null

  return (
    <div className="bg-[#FAF8F4] print:bg-white dark:bg-gray-950">
      <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <ReadingProgress />
        <ViewTracker slug={post.slug} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadCrumbLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
        {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

        <div className="print:hidden">
          <BreadcrumbNav
            segments={[
              { label: "Blog", href: "/blog" },
              ...(post.category ? [{ label: post.category.name, href: `/blog/topic/${post.category.slug}` }] : []),
              { label: post.title.length > 60 ? `${post.title.slice(0, 60)}…` : post.title, href: `/blog/${post.slug}` },
            ]}
            className="mb-5"
          />
        </div>

        {/* - Hero - */}
        <header id="blog-print-header" className="overflow-hidden rounded-2xl border border-[#E8E0CE] bg-white shadow-sm print:rounded-none print:border-[#E5DCC8] print:shadow-none dark:border-gray-800 dark:bg-gray-900">
          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {post.category && (
                <Link
                  href={`/blog/topic/${post.category.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#101E33] px-3 py-1 font-bold text-[#F2EDE0] transition-colors hover:bg-[#1B3A5C]"
                >
                  <FileText className="h-3 w-3" /> {post.category.name}
                </Link>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <Clock3 className="h-3 w-3" /> {readingTime} min read
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300" title={`${post.views.toLocaleString("en-IN")} views`}>
                <Eye className="h-3 w-3" /> {formatCompact(post.views)} views
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EFF4EC] px-3 py-1 font-semibold text-[#2F5D34] dark:bg-green-950 dark:text-green-300">
                <BadgeCheck className="h-3 w-3" /> Fact-checked
              </span>
            </div>

            <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-[1.15] tracking-tight text-gray-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-4 max-w-3xl border-l-[3px] border-[#B08D57] pl-4 text-lg font-medium leading-relaxed text-gray-600 dark:text-gray-300">
                {post.excerpt}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#101E33] text-base font-bold text-[#E8C87A]" aria-hidden>
                  {authorName.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{authorName}</p>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(post.createdAt)} ({timeAgo(post.createdAt)})</span>
                    <span>· Updated {formatDate(post.updatedAt)}</span>
                    <span>· {wordCount.toLocaleString("en-IN")} words</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <SaveButton slug={post.slug} title={post.title} />
                <PrintButton title={post.title} />
              </div>
            </div>
          </div>

          {post.image && (
            <figure className="border-t border-gray-100 dark:border-gray-800">
              <div className="relative aspect-[16/8] w-full overflow-hidden bg-gray-100 sm:aspect-[21/9] dark:bg-gray-800">
                <Image src={post.image} alt={post.title} fill priority sizes="(max-width: 1024px) 100vw, 1100px" className="object-cover" />
              </div>
              <figcaption className="px-6 py-2.5 text-xs text-gray-400">Cover: {post.title} - ChayanJobs Editorial</figcaption>
            </figure>
          )}
        </header>

        {/* - Reader grid - */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[56px_minmax(0,1fr)_280px] print:block print:mt-0">
          <aside className="hidden lg:block print:hidden" aria-hidden>
            <div className="sticky top-24 flex justify-center">
              <ShareRail title={post.title} url={postUrl} />
            </div>
          </aside>

          <article id="blog-print-area" className="min-w-0 rounded-2xl border border-[#E8E0CE] bg-white p-6 shadow-sm sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none dark:border-gray-800 dark:bg-gray-900">
            {/* Print-only masthead: brand + canonical + print date */}
            <div className="hidden print:mb-6 print:block print:border-b-2 print:border-[#101E33] print:pb-4">
              <p className="print:text-lg print:font-extrabold print:text-black">ChayanJobs Blog</p>
              <p className="print:text-xs print:text-gray-600">{postUrl} · Printed {formatDate(new Date())} · {formatCompact(post.views)} views · {readingTime} min read</p>
            </div>
            <KeyTakeaways items={takeaways} />

            {/* Mobile TOC */}
            <div className="mb-6 lg:hidden print:hidden">
              <TableOfContents />
            </div>

            {articleHtml && (
              <div data-article-body className={BLOG_PROSE_CLASSES}>
                <div dangerouslySetInnerHTML={{ __html: articleHtml }} />
              </div>
            )}

            <FaqBlock items={faqs} />

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6 print:hidden dark:border-gray-700">
              <ShareButtons title={post.title} url={postUrl} />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Tag className="h-3.5 w-3.5" />
                {tags.length > 0 ? tags.slice(0, 3).join(" · ") : "Career Guidance"}
              </div>
            </div>

            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                {tags.map((tag) => (
                  <Link key={tag} href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`}>
                    <Badge variant="secondary" className="transition-colors hover:bg-[#F4EDDE] hover:text-[#1B3A5C] dark:hover:bg-blue-900">#{tag}</Badge>
                  </Link>
                ))}
              </div>
            )}

            <div className="print:break-inside-avoid">
              <AuthorCard name={authorName} category={post.category?.name} />
            </div>

            {/* Prev / Next */}
            {(prevPost || nextPost) && (
              <nav className="mt-8 grid gap-3 sm:grid-cols-2 print:hidden" aria-label="More articles">
                {prevPost ? (
                  <Link href={`/blog/${prevPost.slug}`} className="group rounded-xl border border-gray-200 p-4 transition-all hover:border-[#B08D57] hover:shadow-md dark:border-gray-700">
                    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-gray-400"><ChevronLeft className="h-3.5 w-3.5" /> Older</span>
                    <span className="mt-1 line-clamp-2 block text-sm font-semibold text-gray-900 group-hover:text-[#1B3A5C] dark:text-gray-100">{prevPost.title}</span>
                  </Link>
                ) : <span />}
                {nextPost ? (
                  <Link href={`/blog/${nextPost.slug}`} className="group rounded-xl border border-gray-200 p-4 text-right transition-all hover:border-[#B08D57] hover:shadow-md dark:border-gray-700">
                    <span className="flex items-center justify-end gap-1 text-xs font-bold uppercase tracking-wide text-gray-400">Newer <ChevronRight className="h-3.5 w-3.5" /></span>
                    <span className="mt-1 line-clamp-2 block text-sm font-semibold text-gray-900 group-hover:text-[#1B3A5C] dark:text-gray-100">{nextPost.title}</span>
                  </Link>
                ) : <span />}
              </nav>
            )}
          </article>

          <aside className="hidden lg:block print:hidden" aria-hidden>
            <div className="sticky top-24 space-y-4">
              <TableOfContents />
              <div className="rounded-xl border border-[#E5DCC8] bg-[#FAF8F4] p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">In this guide</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{readingTime} min · {wordCount.toLocaleString("en-IN")} words · {formatCompact(post.views)} views</p>
                <p className="mt-1 text-xs leading-5 text-gray-500">Practical, exam-focused and updated {formatDate(post.updatedAt)}.</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="print:hidden">
          <RelatedJobs tags={tags} excludeSlug={post.slug} />
        </div>

        <div className="print:hidden">
          <DiscussionSection postType="BLOG" postId={post.id} path={`/blog/${post.slug}`} />
        </div>

        <NewsletterCTA topic={post.category?.name} />

        {relatedPosts.length > 0 && (
          <section className="mt-12 print:hidden">
            <div className="mb-5 flex items-end justify-between">
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Related Articles</h2>
              <Link href="/blog" className="text-sm font-bold text-[#1B3A5C] hover:text-[#101E33] dark:text-blue-400">View all →</Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`} className="group flex flex-col">
                  <Card className="flex h-full flex-col overflow-hidden border-gray-200 transition-all hover:-translate-y-1 hover:border-[#B08D57] hover:shadow-xl hover:shadow-[#E5DCC8]/50 dark:border-gray-700 dark:bg-gray-900">
                    {rp.image && (
                      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                        <Image src={rp.image} alt={rp.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                    )}
                    <CardHeader className={rp.image ? "pb-2" : ""}>
                      <CardTitle className="line-clamp-2 text-base leading-snug text-gray-900 group-hover:text-[#1B3A5C] dark:text-gray-100">{rp.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      {rp.excerpt && <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{rp.excerpt}</p>}
                      <p className="flex items-center gap-1.5 text-xs text-gray-500" title={`${rp.views.toLocaleString("en-IN")} views`}>
                        <Calendar className="h-3.5 w-3.5" /> {formatDate(rp.createdAt)} ({timeAgo(rp.createdAt)})
                        <span className="mx-1">•</span>
                        <Clock3 className="h-3.5 w-3.5" /> {getReadingTimeMinutes(rp.content)} min read
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
