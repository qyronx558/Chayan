import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { formatCompact, formatDate, getBaseUrl, timeAgo, safeJsonLd } from "@/lib/utils"
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import "@/app/home.css"
import { Calendar, Eye, Clock3, Tag, FileText, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react"
import { PrintButton } from "@/components/blog/PrintButton"
import { ShareButtons } from "@/components/blog/ShareButtons"
import { ShareRail } from "@/components/blog/ShareRail"
import { EntityViewTracker } from "@/components/analytics/EntityViewTracker"
import { ReadingProgress } from "@/components/blog/ReadingProgress"
import { TableOfContents } from "@/components/blog/TableOfContents"
import { BLOG_PROSE_CLASSES, getReadingTimeMinutes, extractTakeaways, extractFaq } from "@/lib/blog-prose"
import { prepareArticleHtml } from "@/lib/rich-html"
import { AuthorCard } from "@/components/blog/AuthorCard"
import { KeyTakeaways } from "@/components/blog/KeyTakeaways"
import { FaqBlock } from "@/components/blog/FaqBlock"
import { SaveButton } from "@/components/blog/SaveButton"
import { RelatedJobs } from "@/components/blog/RelatedJobs"
import { DiscussionSection } from "@/components/discussion/DiscussionSection"

export const revalidate = 86400

// Generate articles on their first request, then use the one-hour ISR cache.
// Builds must not enumerate and render live database records.
export function generateStaticParams(): { slug: string }[] {
  return []
}

const getPublishedPost = cache((slug: string) =>
  prisma.blogPost.findUnique({
    where: { slug, published: true },
    include: { category: true },
  })
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPost(slug)
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
  const post = await getPublishedPost(slug)
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
    <div className="home-saas bg-background text-foreground print:bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <ReadingProgress />
        <EntityViewTracker entityType="BLOG" entityId={post.id} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadCrumbLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(articleLd) }} />
        {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqLd) }} />}

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

        {/* - Hero: the opening spread of a feature - */}
        <header id="blog-print-header" className="pb-2">
          <div className={cn(typeFont.className, "flex flex-wrap items-center gap-x-5 gap-y-1 border-y-2 border-double border-[var(--hs-border-strong)] py-1.5 text-[11px] font-bold uppercase text-foreground/70")}>
            {post.category ? (
              <Link href={`/blog/topic/${post.category.slug}`} className="inline-flex items-center gap-1.5 text-[var(--color-brick)] hover:underline">
                <FileText className="h-3 w-3" /> {post.category.name}
              </Link>
            ) : (
              <span>The ChayanJobs Journal</span>
            )}
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" /> {readingTime} min read</span>
            <span className="inline-flex items-center gap-1" title={`${post.views.toLocaleString("en-IN")} views`}><Eye className="h-3 w-3" /> {formatCompact(post.views)} read</span>
            <span className="ml-auto inline-flex items-center gap-1"><BadgeCheck className="h-3 w-3" /> Fact-checked</span>
          </div>

          <div className="mx-auto max-w-4xl pt-10 text-center sm:pt-14">
            <p className={cn(handFont.className, "text-[1.25rem] text-[var(--color-brick)]")}>a ChayanJobs feature</p>
            <h1 className="mt-2 font-display text-[2.2rem] font-black leading-[1.06] text-foreground sm:text-[3rem] lg:text-[3.6rem]">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mx-auto mt-5 max-w-2xl text-[1.1rem] leading-relaxed text-muted-foreground sm:text-[1.22rem]">
                {post.excerpt}
              </p>
            )}

            <div className="mx-auto mt-7 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <p className="text-sm text-muted-foreground">
                words by <span className={cn(handFont.className, "text-[1.35rem] leading-none text-foreground")}>{authorName}</span>
              </p>
              <p className={cn(typeFont.className, "flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground")}>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(post.createdAt)} ({timeAgo(post.createdAt)})</span>
                <span>updated {formatDate(post.updatedAt)}</span>
                <span>{wordCount.toLocaleString("en-IN")} words</span>
              </p>
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 print:hidden">
              <SaveButton slug={post.slug} title={post.title} />
              <PrintButton title={post.title} />
            </div>
          </div>

          {post.image && (
            <figure className="relative mx-auto mt-10 max-w-5xl -rotate-[0.4deg] bg-[oklch(98%_0.008_90)] p-2.5 pb-3 print:rotate-0" style={{ boxShadow: "0 2px 4px rgb(60 40 10 / .12), 0 26px 40px -26px rgb(60 40 10 / .6)" }}>
              <span className="absolute -top-3 left-10 z-10 h-7 w-24 rotate-[-5deg] bg-[oklch(92%_0.04_90/0.75)] shadow-[0_1px_2px_rgb(0_0_0/.12)] print:hidden" aria-hidden />
              <span className="absolute -top-3 right-10 z-10 h-7 w-24 rotate-[4deg] bg-[oklch(92%_0.04_90/0.75)] shadow-[0_1px_2px_rgb(0_0_0/.12)] print:hidden" aria-hidden />
              <div className="relative aspect-[16/8] w-full overflow-hidden bg-[var(--hs-surface-2)] sm:aspect-[21/9]">
                <Image src={post.image} alt={post.title} fill priority sizes="(max-width: 1024px) 100vw, 1100px" className="object-cover" />
              </div>
              <figcaption className={cn(handFont.className, "px-2 pt-2 text-[0.98rem] text-[oklch(40%_0.03_60)]")}>↑ {post.title}, ChayanJobs Editorial</figcaption>
            </figure>
          )}
        </header>

        {/* - Reader grid - */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[56px_minmax(0,1fr)_280px] print:block print:mt-0">
          <aside className="hidden lg:block print:hidden" aria-hidden>
            <div className="sticky top-24 flex justify-center">
              <ShareRail title={post.title} url={postUrl} />
            </div>
          </aside>

          <article id="blog-print-area" className="min-w-0 rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] px-6 py-8 sm:px-12 sm:py-12 print:border-0 print:p-0" style={{ boxShadow: "0 1px 2px rgb(60 40 10 / .08), 0 22px 36px -28px rgb(60 40 10 / .55)" }}>
            {/* Print-only masthead: brand + canonical + print date */}
            <div className="hidden print:mb-6 print:block print:border-b-2 print:border-black print:pb-4">
              <p className="print:text-lg print:font-extrabold print:text-black">ChayanJobs Blog</p>
              <p className="print:text-xs print:text-muted-foreground">{postUrl} | Printed {formatDate(new Date())} | {formatCompact(post.views)} views | {readingTime} min read</p>
            </div>
            <KeyTakeaways items={takeaways} />

            {/* Mobile TOC */}
            <div className="mb-6 lg:hidden print:hidden">
              <TableOfContents />
            </div>

            {articleHtml && (
              <div data-article-body className={cn(BLOG_PROSE_CLASSES, "[&>div>p:first-of-type]:first-letter:float-left [&>div>p:first-of-type]:first-letter:mr-2.5 [&>div>p:first-of-type]:first-letter:mt-1 [&>div>p:first-of-type]:first-letter:font-display [&>div>p:first-of-type]:first-letter:text-[4.2rem] [&>div>p:first-of-type]:first-letter:font-black [&>div>p:first-of-type]:first-letter:leading-[0.8] [&>div>p:first-of-type]:first-letter:text-[var(--color-brick)]")}>
                <div dangerouslySetInnerHTML={{ __html: articleHtml }} />
              </div>
            )}

            <FaqBlock items={faqs} />

            <p className="mt-10 text-center text-[var(--color-brick)] print:hidden" aria-hidden>❦</p>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-[var(--hs-border-strong)] pt-6 print:hidden">
              <ShareButtons title={post.title} url={postUrl} />
              <div className={cn(typeFont.className, "flex items-center gap-2 text-[11.5px] text-muted-foreground")}>
                <Tag className="h-3.5 w-3.5" />
                {tags.length > 0 ? tags.slice(0, 3).join(", ") : "Career Guidance"}
              </div>
            </div>

            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 print:hidden">
                {tags.map((tag, i) => (
                  <Link key={tag} href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, "-")}`} className={cn(handFont.className, "text-[1.05rem] text-[var(--hs-trust)] hover:text-[var(--color-brick)] hover:underline", i % 2 ? "rotate-[2deg]" : "-rotate-[2deg]")}>
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            <div className="print:break-inside-avoid">
              <AuthorCard name={authorName} category={post.category?.name} />
            </div>

            {/* Prev / Next: turn the page */}
            {(prevPost || nextPost) && (
              <nav className="mt-10 grid gap-4 sm:grid-cols-2 print:hidden" aria-label="More articles">
                {prevPost ? (
                  <Link href={`/blog/${prevPost.slug}`} className="group rounded-[3px] border border-dashed border-[var(--hs-border-strong)] p-4 transition-colors hover:border-solid">
                    <span className={cn(handFont.className, "flex items-center gap-1 text-[1rem] text-muted-foreground")}><ChevronLeft className="h-3.5 w-3.5" /> turn back a page</span>
                    <span className="mt-1 line-clamp-2 block font-display text-[1rem] font-bold text-foreground group-hover:underline group-hover:decoration-[var(--color-brick)] group-hover:underline-offset-2">{prevPost.title}</span>
                  </Link>
                ) : <span />}
                {nextPost ? (
                  <Link href={`/blog/${nextPost.slug}`} className="group rounded-[3px] border border-dashed border-[var(--hs-border-strong)] p-4 text-right transition-colors hover:border-solid">
                    <span className={cn(handFont.className, "flex items-center justify-end gap-1 text-[1rem] text-muted-foreground")}>turn the page <ChevronRight className="h-3.5 w-3.5" /></span>
                    <span className="mt-1 line-clamp-2 block font-display text-[1rem] font-bold text-foreground group-hover:underline group-hover:decoration-[var(--color-brick)] group-hover:underline-offset-2">{nextPost.title}</span>
                  </Link>
                ) : <span />}
              </nav>
            )}
          </article>

          <aside className="hidden lg:block print:hidden" aria-hidden>
            <div className="sticky top-24 space-y-6">
              <TableOfContents />
              <div className="relative rotate-[0.8deg] px-4 pb-4 pt-4 text-[oklch(28%_0.03_60)]" style={{ background: "oklch(93% 0.035 85)", boxShadow: "0 1px 1px rgb(60 40 10 / .08), 0 14px 24px -16px rgb(60 40 10 / .5)" }}>
                <p className={cn(typeFont.className, "text-[10.5px] font-bold tracking-[0.2em]")}>THIS PIECE</p>
                <p className="mt-1.5 font-display text-[1.05rem] font-bold">{readingTime} min · {wordCount.toLocaleString("en-IN")} words</p>
                <p className={cn(typeFont.className, "text-[11px] opacity-70")}>{formatCompact(post.views)} readers so far</p>
                <p className={cn(handFont.className, "mt-2 text-[1rem] leading-snug")}>practical, exam-focused, last checked {formatDate(post.updatedAt)}.</p>
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

        {relatedPosts.length > 0 && (
          <section className="mt-16 print:hidden">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-dashed border-[var(--hs-border-strong)] pb-3">
              <div>
                <p className={cn(handFont.className, "text-[1.15rem] text-[var(--color-brick)]")}>keep reading</p>
                <h2 className="font-display text-[1.6rem] font-black leading-tight text-foreground">Related articles</h2>
              </div>
              <Link href="/blog" className={cn(handFont.className, "text-[1.1rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4 hover:text-[var(--color-brick)]")}>back to the desk →</Link>
            </div>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((rp, i) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className={cn("group flex flex-col rounded-[2px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] p-3 transition-transform duration-300 hover:-translate-y-1", i % 3 === 1 ? "rotate-[0.5deg]" : i % 3 === 2 ? "-rotate-[0.4deg]" : "")}
                  style={{ boxShadow: "0 1px 2px rgb(60 40 10 / .08), 0 16px 28px -22px rgb(60 40 10 / .55)" }}
                >
                  {rp.image && (
                    <div className="relative aspect-video w-full overflow-hidden bg-[var(--hs-surface-2)]">
                      <Image src={rp.image} alt={rp.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col px-1.5 pt-3">
                    <h3 className="line-clamp-2 font-display text-[1.05rem] font-bold leading-snug text-foreground group-hover:underline group-hover:decoration-[var(--color-brick)] group-hover:underline-offset-2">{rp.title}</h3>
                    {rp.excerpt && <p className="mt-1.5 line-clamp-2 text-[13.5px] text-muted-foreground">{rp.excerpt}</p>}
                    <p className={cn(typeFont.className, "mt-auto flex flex-wrap items-center gap-x-3 pt-3 text-[10.5px] text-muted-foreground")} title={`${rp.views.toLocaleString("en-IN")} views`}>
                      <span>{formatDate(rp.createdAt)} ({timeAgo(rp.createdAt)})</span>
                      <span>{getReadingTimeMinutes(rp.content)} min read</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
