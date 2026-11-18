"use client"

import Image from "next/image"
import Link from "next/link"
import { cn, formatCompact, formatDate } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { Tape, paperShadow, seeded, tilt } from "@/components/desk/DeskKit"

/*
 * The blog is the reading desk: a magazine you keep going back to, pages you
 * tore out because one paragraph mattered, a library card stamped every time
 * someone borrowed the book, and a glass of cutting chai going cold beside
 * it all. Only the look lives here; the page keeps its own fetching.
 */

export interface DeskPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  image: string | null
  views: number
  createdAt: string
  readingTime: number
  category: { id: string; name: string; slug: string; color: string | null } | null
}

/* ───────── hero art: open book, pencil, cutting chai ───────── */

export function ReadingDeskArt() {
  return (
    <div className="relative mx-auto w-full max-w-[24rem]" aria-hidden>
      <svg viewBox="0 0 320 210" className="w-full drop-shadow-[0_22px_26px_rgb(40_20_0/.28)]">
        {/* open book */}
        <path d="M18 60 C 70 44, 120 48, 158 66 L 158 196 C 120 178, 70 174, 18 190 Z" fill="oklch(97% 0.012 88)" stroke="oklch(70% 0.03 70)" strokeWidth="1" />
        <path d="M298 60 C 246 44, 196 48, 158 66 L 158 196 C 196 178, 246 174, 298 190 Z" fill="oklch(98% 0.008 90)" stroke="oklch(70% 0.03 70)" strokeWidth="1" />
        <path d="M158 66 L 158 196" stroke="oklch(62% 0.03 70)" strokeWidth="1.4" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={`l${i}`} d={`M34 ${80 + i * 13} C 70 ${70 + i * 13}, 110 ${72 + i * 13}, 144 ${86 + i * 13}`} stroke="oklch(72% 0.02 70)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity={i === 3 ? 0 : 1} />
        ))}
        {/* underlined line, highlighted */}
        <path d="M34 119 C 70 109, 110 111, 144 125" stroke="oklch(88% 0.17 95)" strokeWidth="7" strokeLinecap="round" fill="none" opacity=".85" />
        <path d="M34 119 C 70 109, 110 111, 144 125" stroke="oklch(45% 0.02 70)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={`r${i}`} d={`M172 ${86 + i * 13} C 206 ${72 + i * 13}, 246 ${70 + i * 13}, 282 ${80 + i * 13}`} stroke="oklch(72% 0.02 70)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        ))}
        {/* margin note */}
        <path d="M262 150 C 270 146, 280 150, 284 158" stroke="oklch(50% 0.18 28)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <text x="236" y="176" fontSize="11" fill="oklch(50% 0.18 28)" className={handFont.className} transform="rotate(-6 236 176)">read twice!</text>
        {/* ribbon bookmark */}
        <path d="M200 52 L 200 112 L 207 104 L 214 112 L 214 50" fill="oklch(50% 0.17 28)" />
        {/* pencil */}
        <g transform="rotate(-24 120 200)">
          <rect x="40" y="196" width="150" height="9" rx="1.5" fill="oklch(80% 0.15 85)" />
          <rect x="182" y="196" width="14" height="9" fill="oklch(75% 0.08 20)" />
          <path d="M40 196 L 26 200.5 L 40 205 Z" fill="oklch(85% 0.04 70)" />
          <path d="M26 200.5 L 22 200.5" stroke="oklch(30% 0.02 60)" strokeWidth="2" />
        </g>
      </svg>
      {/* cutting chai, still steaming */}
      <div className="absolute -right-2 -top-6 w-[72px] sm:-right-6">
        <svg viewBox="0 0 60 90" className="w-full">
          <path className="hs-rise" d="M22 20 C 16 12, 28 8, 22 0" stroke="oklch(70% 0.01 60)" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" />
          <path className="hs-rise" style={{ animationDelay: ".8s" }} d="M36 22 C 30 14, 42 10, 36 2" stroke="oklch(70% 0.01 60)" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".6" />
          <path d="M10 30 L 50 30 L 45 86 L 15 86 Z" fill="oklch(92% 0.01 220 / .55)" stroke="oklch(70% 0.01 220)" strokeWidth="1.2" />
          <path d="M12.5 44 L 47.5 44 L 45 86 L 15 86 Z" fill="oklch(62% 0.09 55)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${16 + i * 7} 32 L ${18 + i * 6} 84`} stroke="oklch(100% 0 0 / .35)" strokeWidth="1" />
          ))}
        </svg>
        <p className={cn(handFont.className, "text-center text-[0.85rem] leading-none text-muted-foreground")}>chai</p>
      </div>
    </div>
  )
}

/* ───────── cover story ───────── */

export function CoverStory({ post, excerpt }: { post: DeskPost; excerpt: string | null }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group relative block -rotate-[0.6deg] transition-transform duration-300 hover:rotate-0">
      {/* binder clip */}
      <span className="absolute -top-4 left-1/2 z-10 h-7 w-20 -translate-x-1/2 rounded-[3px] bg-[oklch(25%_0.01_250)] shadow-[0_3px_5px_rgb(0_0_0/.3)]" aria-hidden>
        <span className="absolute -top-3 left-3 h-4 w-14 rounded-t-full border-[2.5px] border-b-0 border-[oklch(75%_0.01_250)]" />
      </span>
      <div className="rounded-[2px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] p-3 pb-5" style={{ boxShadow: paperShadow }}>
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--hs-surface-2)]">
          {post.image ? (
            <Image src={post.image} alt="" fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <span className="font-display text-3xl font-black text-foreground/15">ChayanJobs Journal</span>
            </div>
          )}
          <span className={cn(typeFont.className, "absolute left-3 top-3 -rotate-[4deg] border-2 border-[oklch(97%_0.01_90)] bg-[var(--color-brick)] px-2 py-0.5 text-[11px] font-bold text-[oklch(97%_0.01_90)]")}>
            COVER STORY
          </span>
        </div>
        <div className="px-2 pt-4">
          {post.category && (
            <span className={cn(typeFont.className, "text-[11px] font-bold uppercase")} style={{ color: post.category.color || "var(--color-brick)" }}>
              {post.category.name}
            </span>
          )}
          <h2 className="mt-1 font-display text-[1.8rem] font-black leading-[1.12] text-foreground group-hover:underline group-hover:decoration-[var(--color-brick)] group-hover:decoration-2 group-hover:underline-offset-4 sm:text-[2.2rem]">
            {post.title}
          </h2>
          {excerpt && <p className="mt-3 line-clamp-3 text-[15.5px] leading-7 text-muted-foreground">{excerpt}</p>}
          <p className={cn(typeFont.className, "mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground")}>
            <span>{formatDate(post.createdAt, "d MMM yyyy")}</span>
            <span>{post.readingTime} min read</span>
            <span className={cn(handFont.className, "ml-auto text-[1.15rem] text-[var(--hs-trust)] underline decoration-wavy decoration-1 underline-offset-4")}>read the story →</span>
          </p>
        </div>
      </div>
    </Link>
  )
}

/* ───────── contents page ───────── */

export function ContentsPage({ posts }: { posts: DeskPost[] }) {
  return (
    <div className="relative rounded-[2px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] px-5 pb-4 pt-5 lg:rotate-[0.4deg]" style={{ boxShadow: paperShadow }}>
      <p className={cn(typeFont.className, "border-b-2 border-double border-[var(--hs-border-strong)] pb-2 text-center text-[12px] font-bold tracking-[0.3em] text-foreground/80")}>CONTENTS</p>
      <ol className="mt-1">
        {posts.map((post, i) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="group flex items-baseline gap-3 border-b border-dotted border-[var(--hs-border-strong)] py-3 last:border-b-0">
              <span className={cn(handFont.className, "w-6 shrink-0 text-[1.4rem] leading-none text-[var(--color-brick)]")}>{i + 1}.</span>
              <span className="min-w-0 flex-1">
                {post.category && (
                  <span className={cn(typeFont.className, "block text-[10px] font-bold uppercase")} style={{ color: post.category.color || "var(--color-brick)" }}>
                    {post.category.name}
                  </span>
                )}
                <span className="line-clamp-2 block font-display text-[1.05rem] font-bold leading-snug text-foreground group-hover:underline group-hover:decoration-[var(--color-brick)] group-hover:underline-offset-2">{post.title}</span>
              </span>
              <span className={cn(typeFont.className, "shrink-0 text-[10.5px] text-muted-foreground")}>{post.readingTime} min</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ───────── a torn-out magazine page ───────── */

function CoffeeRing({ id }: { id: string }) {
  if (seeded(id, 3) > 0.28) return null
  return (
    <span
      className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full opacity-[0.22] mix-blend-multiply dark:opacity-[0.12] dark:mix-blend-screen"
      style={{ border: "5px solid oklch(55% 0.09 55)", filter: "blur(.6px)", maskImage: "conic-gradient(#000 0 300deg, transparent 300deg 330deg, #000 330deg)" }}
      aria-hidden
    />
  )
}

export function MagazineClip({ post, index, wide }: { post: DeskPost; index: number; wide?: boolean }) {
  const color = post.category?.color || "var(--color-brick)"
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        "group relative flex overflow-hidden rounded-[2px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] transition-transform duration-300 hover:-translate-y-1",
        wide ? "mb-5 flex-row gap-4 p-3" : "h-full flex-col p-3",
        !wide && tilt(index)
      )}
      style={{ boxShadow: paperShadow }}
    >
      {index % 4 === 1 && !wide && <Tape className="-top-2.5 left-1/2 z-10 -translate-x-1/2 rotate-[3deg]" />}
      <div className={cn("relative shrink-0 overflow-hidden bg-[var(--hs-surface-2)]", wide ? "aspect-[4/3] w-36 sm:w-48" : "aspect-[16/10] w-full")}>
        {post.image ? (
          <Image src={post.image} alt="" fill sizes={wide ? "200px" : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"} className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
        ) : (
          <div className="flex h-full items-end p-3">
            <span className="h-1 w-10 rounded-full" style={{ background: color }} />
          </div>
        )}
      </div>
      <div className={cn("flex min-w-0 flex-1 flex-col", wide ? "py-1 pr-2" : "px-1.5 pt-3")}>
        {post.category && (
          <span className={cn(typeFont.className, "text-[10.5px] font-bold uppercase")} style={{ color }}>
            {post.category.name}
          </span>
        )}
        <h3 className="mt-1 line-clamp-3 font-display text-[1.1rem] font-bold leading-snug text-foreground group-hover:underline group-hover:decoration-[var(--color-brick)] group-hover:underline-offset-2">{post.title}</h3>
        {post.excerpt && <p className={cn("mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground", wide ? "line-clamp-2" : "line-clamp-2")}>{post.excerpt}</p>}
        <p className={cn(typeFont.className, "mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-[10.5px] text-muted-foreground")}>
          <span>{formatDate(post.createdAt, "d MMM yyyy")}</span>
          {post.readingTime ? <span>{post.readingTime} min</span> : null}
          <span className="ml-auto" title={`${post.views.toLocaleString("en-IN")} views`}>{formatCompact(post.views)} read</span>
        </p>
      </div>
      <CoffeeRing id={post.id} />
    </Link>
  )
}

export function ClipSkeleton() {
  return (
    <div className="rounded-[2px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] p-3">
      <span className="hs-skel block aspect-[16/10] w-full" />
      <span className="hs-skel mt-3 block h-3 w-1/3" />
      <span className="hs-skel mt-2 block h-4 w-11/12" />
      <span className="hs-skel mt-1.5 block h-4 w-3/4" />
    </div>
  )
}

/* ───────── library card: most read ───────── */

export function LibraryCard({ posts }: { posts: { id: string; slug: string; title: string; views: number }[] }) {
  return (
    <div className="relative rotate-[0.6deg] rounded-[2px] bg-[oklch(93%_0.035_85)] px-4 pb-4 pt-3 text-[oklch(28%_0.03_60)]" style={{ boxShadow: "0 1px 1px rgb(60 40 10 / .08), 0 16px 28px -18px rgb(60 40 10 / .5)" }}>
      <p className={cn(typeFont.className, "text-center text-[11px] font-bold tracking-[0.2em]")}>DATE DUE · MOST READ</p>
      <div className={cn(typeFont.className, "mt-2 grid grid-cols-[1.4rem_1fr_3.6rem] border-y-2 border-[oklch(50%_0.13_255/0.6)] text-[10px] font-bold text-[oklch(40%_0.1_255)]")}>
        <span className="border-r border-[oklch(50%_0.13_255/0.4)] py-1">No.</span>
        <span className="border-r border-[oklch(50%_0.13_255/0.4)] px-2 py-1">Title</span>
        <span className="px-1 py-1 text-right">Issued</span>
      </div>
      {posts.map((p, i) => (
        <Link key={p.id} href={`/blog/${p.slug}`} className="group grid grid-cols-[1.4rem_1fr_3.6rem] items-center border-b border-[oklch(50%_0.13_255/0.25)] py-2" title={`${p.views.toLocaleString("en-IN")} views`}>
          <span className={cn(handFont.className, "text-[1.1rem] leading-none text-[oklch(50%_0.18_28)]")}>{i + 1}</span>
          <span className="line-clamp-2 px-2 text-[13px] font-semibold leading-snug group-hover:underline">{p.title}</span>
          <span className={cn(typeFont.className, "justify-self-end -rotate-[6deg] rounded-[3px] border border-[oklch(50%_0.18_28/0.7)] px-1 text-[10px] font-bold text-[oklch(50%_0.18_28)]")}>{formatCompact(p.views)}×</span>
        </Link>
      ))}
      {posts.length === 0 && <p className={cn(handFont.className, "py-3 text-center text-[1.05rem]")}>no one has borrowed these yet.</p>}
    </div>
  )
}
