/* eslint-disable @next/next/no-img-element */
"use client"

import Link from "next/link"
import { Clock3, Eye } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import { SectionTabs } from "@/components/home/SectionTabs"
import { useHomeSection } from "@/components/home/use-home-section"
import { HomeSectionHeader } from "@/components/home/ui/HomeSectionHeader"
import { handFont } from "@/components/home/fonts"
import { cleanTitle, filterValidItems } from "@/lib/card-helpers"

/*
 * "From the desk" — set like an aspirant's actual study desk.
 * The lead article is a page from an Indian school notebook (blue rules, the
 * double red margin, punched holes, the "Date / Page No." boxes). The rest are
 * index cards taped up with marigold tape, each at its own slight angle,
 * the way a person pins things, not the way a grid places them.
 * Handwritten notes only say what the data supports ("start here",
 * "most read").
 */

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
  image?: string | null
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
  image: (item.image as string | null | undefined) ?? null,
  views: item.views as number | undefined,
  createdAt: item.createdAt as string,
  category: item.category as { name: string } | null | undefined,
})

/* Notebook ink: ruled lines in pale blue, margin in red — as printed in real exercise books. */
const RULE = "color-mix(in oklch, oklch(62% 0.09 240) 28%, transparent)"
const MARGIN = "color-mix(in oklch, var(--color-brick) 55%, transparent)"
const LINE = 30 // px between rules; body text sits on them

const CARD_TILT = ["lg:rotate-[1.4deg]", "lg:-rotate-[1.1deg]", "lg:-rotate-[0.7deg]", "lg:rotate-[1deg]"]
const TAPE_TILT = ["-rotate-[4deg]", "rotate-[3deg]", "rotate-[5deg]", "-rotate-[2deg]"]

function Tape({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2", className)}
      style={{
        background: "color-mix(in oklch, var(--hs-marigold) 55%, transparent)",
        boxShadow: "0 1px 2px rgb(60 40 10 / .12)",
        clipPath: "polygon(3% 0, 97% 4%, 100% 50%, 96% 100%, 2% 96%, 0 45%)",
      }}
    />
  )
}

function Meta({ post }: { post: BlogItem }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Clock3 className="h-3 w-3" />
        {readingTime(post.content)} min read
      </span>
      {typeof post.views === "number" && post.views > 0 && (
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {post.views.toLocaleString("en-IN")} readers
        </span>
      )}
    </span>
  )
}

/* ── The open notebook page ── */
function NotebookPage({ post, note }: { post: BlogItem; note: string }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group relative block lg:-rotate-[0.6deg]">
      {/* handwritten pointer, outside the page */}
      <span
        className={cn(handFont.className, "absolute -top-9 left-24 hidden items-end gap-1 text-[1.15rem] text-[var(--hs-trust)] lg:flex")}
        aria-hidden
      >
        {note}
        <svg width="34" height="26" viewBox="0 0 34 26" fill="none" className="mb-[-14px]">
          <path d="M2 4 C 14 4, 24 8, 28 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M22 18 L28 23 L31 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <div
        className="relative flex flex-col overflow-hidden rounded-[6px] border border-[var(--hs-border)] bg-[var(--hs-surface)] pb-8 pl-[4.5rem] lg:min-h-[470px] pr-6 pt-6 transition-shadow duration-300 group-hover:shadow-[0_30px_60px_-34px_rgb(60_40_10/.5)] sm:pl-24 sm:pr-10"
        style={{
          boxShadow: "0 1px 2px rgb(60 40 10 / .06), 0 22px 44px -32px rgb(60 40 10 / .4)",
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${LINE - 1}px, ${RULE} ${LINE - 1}px, ${RULE} ${LINE}px)`,
          backgroundPosition: "0 70px",
        }}
      >
        {/* double red margin */}
        <span className="absolute inset-y-0 left-[3.25rem] w-px sm:left-[4.75rem]" style={{ background: MARGIN }} aria-hidden />
        <span className="absolute inset-y-0 left-[3.5rem] w-px sm:left-[5rem]" style={{ background: MARGIN }} aria-hidden />
        {/* punched holes */}
        {["18%", "50%", "82%"].map((top) => (
          <span
            key={top}
            className="absolute left-3 h-4 w-4 rounded-full sm:left-5"
            style={{ top, background: "var(--color-paper)", boxShadow: "inset 0 1px 2px rgb(40 30 20 / .35)" }}
            aria-hidden
          />
        ))}

        {/* Date / Page No. boxes, as printed on exercise books */}
        <div className="flex justify-end gap-5 text-[11px] text-muted-foreground">
          <span className="flex items-end gap-1.5">
            Date
            <span className={cn(handFont.className, "min-w-[5.5rem] border-b border-dotted border-current px-1 text-[15px] leading-none text-foreground")}>
              {formatDate(post.createdAt, "dd/MM/yyyy")}
            </span>
          </span>
          <span className="hidden items-end gap-1.5 sm:flex">
            Page No.
            <span className={cn(handFont.className, "min-w-[2rem] border-b border-dotted border-current px-1 text-[15px] leading-none text-foreground")}>
              01
            </span>
          </span>
        </div>

        {post.image && (
          <span className="float-right mb-3 ml-5 mt-5 hidden w-40 rotate-[3deg] bg-white p-2 pb-6 shadow-[0_8px_18px_-8px_rgb(0_0_0/.35)] sm:block">
            <Tape className="w-14" />
            <img src={post.image} alt="" loading="lazy" className="aspect-square w-full object-cover" />
          </span>
        )}

        <p className={cn(handFont.className, "mt-5 text-[1.05rem] leading-[30px] text-[var(--color-brick)]")}>
          {post.category?.name || "Featured guide"}
        </p>
        <h3 className="font-display text-[1.7rem] font-bold leading-[1.18] text-foreground transition-colors group-hover:text-[var(--hs-trust)] sm:text-[2.15rem]">
          {cleanTitle(post.title)}
        </h3>
        {post.excerpt && (
          <p className="mt-[14px] line-clamp-4 max-w-xl text-[15.5px] leading-[30px] text-foreground/75">{post.excerpt}</p>
        )}

        <div className="clear-both mt-auto flex flex-wrap items-center justify-between gap-3 pt-8">
          <Meta post={post} />
          <span className={cn(handFont.className, "text-[1.15rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-[6px]")}>
            read the full note →
          </span>
        </div>
      </div>

      {/* the chai ring every desk eventually gets */}
      <svg
        className="pointer-events-none absolute -bottom-12 -left-12 hidden h-28 w-28 opacity-[0.16] lg:block"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <circle cx="50" cy="50" r="38" fill="none" stroke="oklch(45% 0.08 55)" strokeWidth="5" strokeDasharray="190 12 30 8" />
        <circle cx="50" cy="50" r="33" fill="none" stroke="oklch(45% 0.08 55)" strokeWidth="1.2" opacity=".6" />
      </svg>
    </Link>
  )
}

/* ── An index card taped up ── */
function IndexCard({ post, index, note }: { post: BlogItem; index: number; note?: string }) {
  return (
    <Link href={`/blog/${post.slug}`} className={cn("group relative block", CARD_TILT[index % CARD_TILT.length])}>
      <Tape className={TAPE_TILT[index % TAPE_TILT.length]} />
      <div
        className="relative h-full overflow-hidden rounded-[4px] border border-[var(--hs-border)] bg-[var(--hs-surface)] px-5 pb-5 pt-6 transition-shadow duration-300 group-hover:shadow-[0_22px_40px_-26px_rgb(60_40_10/.55)]"
        style={{
          boxShadow: "0 1px 2px rgb(60 40 10 / .06), 0 14px 28px -22px rgb(60 40 10 / .35)",
          backgroundImage: `linear-gradient(to bottom, transparent 0, transparent 46px, ${MARGIN} 46px, ${MARGIN} 47px, transparent 47px), repeating-linear-gradient(to bottom, transparent 0, transparent 23px, ${RULE} 23px, ${RULE} 24px)`,
          backgroundPosition: "0 0, 0 47px",
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-[11px] font-semibold text-[var(--hs-trust)]">{post.category?.name || "Note"}</span>
          {note && (
            <span className={cn(handFont.className, "-mt-1 shrink-0 -rotate-[4deg] text-[1rem] leading-none text-[var(--color-brick)]")}>
              {note}
            </span>
          )}
        </div>
        <h3 className="mt-4 line-clamp-3 text-[15px] font-bold leading-[24px] text-foreground transition-colors group-hover:text-[var(--hs-trust)]">
          {cleanTitle(post.title)}
        </h3>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Meta post={post} />
          <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">{formatDate(post.createdAt, "dd MMM")}</span>
        </div>
      </div>
    </Link>
  )
}

export function LatestBlog() {
  const { latest, trending, trendingMeta, tab, selectTab, loading, trendingLoading } = useHomeSection(
    "/api/blog?limit=5",
    "/api/blog?limit=5&sort=trending"
  )

  const posts = filterValidItems(((tab === "trending" ? trending : latest) ?? []).map(toPost)).slice(0, 5)
  const busy = tab === "trending" ? trendingLoading && trending === null : loading

  if (!busy && posts.length === 0) return null

  const [lead, ...rest] = posts
  const mostRead = rest.reduce<BlogItem | null>((best, p) => ((p.views ?? 0) > (best?.views ?? 0) ? p : best), null)

  return (
    <section className="hs-section relative">
      <div className="hs-container">
        <HomeSectionHeader
          eyebrow="from the desk"
          title="Notes for the preparation years"
          mark="preparation years"
          markStyle="highlight"
          subtitle={
            tab === "trending" && trendingMeta && !trendingMeta.fallback
              ? `What aspirants read most over the last ${trendingMeta.windowDays} days.`
              : "For the evenings when the syllabus feels endless: study methods, help with forms, and honest advice. Short enough to read with a cup of chai between chapters."
          }
          viewAllHref="/blog"
          viewAllLabel="All notes"
          action={<SectionTabs tab={tab} onChange={selectTab} />}
        />

        {busy ? (
          <div className="grid gap-8 lg:grid-cols-12">
            <span className="hs-skel block h-96 lg:col-span-7" />
            <div className="grid gap-6 sm:grid-cols-2 lg:col-span-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="hs-skel block h-44" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid items-start gap-x-10 gap-y-12 pt-6 lg:grid-cols-12">
            {lead && (
              <div className="min-w-0 lg:col-span-7">
                <NotebookPage post={lead} note={tab === "trending" ? "everyone's reading this" : "start here"} />
              </div>
            )}
            {rest.length > 0 && (
              <div className="grid min-w-0 gap-x-6 gap-y-9 sm:grid-cols-2 lg:col-span-5">
                {rest.map((post, i) => (
                  <IndexCard
                    key={post.id}
                    post={post}
                    index={i}
                    note={mostRead && post.id === mostRead.id && (post.views ?? 0) > 0 ? "most read ★" : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
