import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react"
import { DocsToc } from "@/components/docs/DocsToc"
import { DOCS_UPDATED, allDocs, getDoc, groupTitle, neighbours } from "@/components/docs/registry"
import { siteConfig } from "@/lib/constants"
import { safeJsonLd } from "@/lib/utils"

export const dynamicParams = false

export function generateStaticParams(): { slug: string }[] {
  return allDocs().map((a) => ({ slug: a.meta.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const doc = getDoc(slug)
  if (!doc) return {}
  const url = `${siteConfig.url}/docs/${doc.meta.slug}`
  return {
    title: `${doc.meta.title} · Help Centre`,
    description: doc.meta.description,
    alternates: { canonical: url },
    openGraph: { title: `${doc.meta.title} - ChayanJobs Help Centre`, description: doc.meta.description, url, type: "article" },
  }
}

const updatedLabel = new Date(`${DOCS_UPDATED}T00:00:00+05:30`).toLocaleDateString("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kolkata",
})

export default async function DocArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = getDoc(slug)
  if (!doc) notFound()

  const { meta, Body } = doc
  const { prev, next } = neighbours(slug)
  const group = groupTitle(meta.group)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: meta.title,
    description: meta.description,
    dateModified: DOCS_UPDATED,
    inLanguage: "en-IN",
    publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    mainEntityOfPage: `${siteConfig.url}/docs/${meta.slug}`,
  }

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_13rem]">
      <article className="min-w-0 max-w-[46rem]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

        <nav aria-label="Breadcrumb" className="docs-chrome">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/docs" className="underline decoration-1 underline-offset-4 hover:text-brick">
                Help Centre
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-rule" aria-hidden />
              <span>{group}</span>
            </li>
          </ol>
        </nav>

        <header className="mt-4 border-b-2 border-rule-2 pb-5">
          <h1 className="text-[2.1rem] text-foreground sm:text-[2.7rem]">{meta.title}</h1>
          <p className="mt-3 max-w-[60ch] text-[1.15rem] leading-relaxed text-muted-foreground">{meta.description}</p>
          <p className="agate mt-4 text-xs text-muted-foreground">
            {meta.minutes} min read <span aria-hidden>·</span> Last updated {updatedLabel}
          </p>
        </header>

        {/* On smaller screens the section list sits above the article. */}
        <details className="docs-chrome mt-6 border border-rule bg-paper-2 px-4 py-2 xl:hidden">
          <summary className="agate cursor-pointer py-1 text-sm text-foreground">On this page</summary>
          <ul className="mt-2 space-y-1.5 pb-2">
            {meta.toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="text-[0.95rem] text-ink-2 underline decoration-rule underline-offset-4 hover:text-brick">
                  {t.title}
                </a>
              </li>
            ))}
          </ul>
        </details>

        <div className="mt-8">
          <Body />
        </div>

        <aside className="docs-chrome mt-14 border-y-2 border-rule-2 bg-paper-2 px-5 py-5">
          <p className="font-display text-lg font-bold text-foreground">Still have a question?</p>
          <p className="mt-1 text-[0.98rem] leading-relaxed text-ink-2">
            Check the <Link href="/docs/faq" className="text-brick underline underline-offset-4">FAQ</Link>, or{" "}
            <Link href="/contact" className="text-brick underline underline-offset-4">write to us</Link>. Tell us which page you were on; it helps
            us improve this guide.
          </p>
        </aside>

        <nav aria-label="More guides" className="docs-chrome mt-8 grid gap-px border border-rule bg-rule sm:grid-cols-2">
          {prev ? (
            <Link href={`/docs/${prev.slug}`} className="group bg-paper p-4 no-underline hover:bg-paper-2">
              <span className="agate flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Previous
              </span>
              <span className="mt-1 block font-display font-bold text-foreground group-hover:text-brick">{prev.title}</span>
            </Link>
          ) : (
            <span className="hidden bg-paper sm:block" />
          )}
          {next ? (
            <Link href={`/docs/${next.slug}`} className="group bg-paper p-4 text-right no-underline hover:bg-paper-2">
              <span className="agate flex items-center justify-end gap-1 text-xs text-muted-foreground">
                Next <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="mt-1 block font-display font-bold text-foreground group-hover:text-brick">{next.title}</span>
            </Link>
          ) : (
            <span className="hidden bg-paper sm:block" />
          )}
        </nav>
      </article>

      <div className="hidden xl:block">
        <div className="sticky top-24">
          <DocsToc items={meta.toc} />
        </div>
      </div>
    </div>
  )
}
