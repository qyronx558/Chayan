import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import "@/app/home.css"

const paperShadow = "0 1px 2px rgb(60 40 10 / .08), 0 16px 28px -22px rgb(60 40 10 / .55)"

export const metadata: Metadata = {
  title: "Sitemap",
  description: "Complete sitemap of ChayanJobs - Browse all pages, job listings, results, admit cards and more.",
}

export const dynamic = "force-dynamic"

export default async function SitemapPage() {
  const [jobs, results, admitCards, answerKeys, syllabus, admissions, categories] = await Promise.all([
    prisma.job.findMany({ where: { moderation: "APPROVED" }, select: { title: true, slug: true }, orderBy: { title: "asc" }, take: 100 }),
    prisma.result.findMany({ where: { moderation: "APPROVED" }, select: { title: true, slug: true }, orderBy: { title: "asc" }, take: 100 }),
    prisma.admitCard.findMany({ where: { moderation: "APPROVED" }, select: { title: true, slug: true }, orderBy: { title: "asc" }, take: 100 }),
    prisma.answerKey.findMany({ where: { moderation: "APPROVED" }, select: { title: true, slug: true }, orderBy: { title: "asc" }, take: 100 }),
    prisma.syllabus.findMany({ where: { moderation: "APPROVED" }, select: { title: true, slug: true }, orderBy: { title: "asc" }, take: 100 }),
    prisma.admission.findMany({ where: { moderation: "APPROVED" }, select: { title: true, slug: true }, orderBy: { title: "asc" }, take: 100 }),
    prisma.category.findMany({ select: { name: true, slug: true }, orderBy: { name: "asc" } }),
  ])

  /*
   * A sitemap is a building directory: the board in the lobby that tells
   * you which floor has what. Every section of the site is a floor, with
   * its main rooms first and the latest arrivals below.
   */
  const floors: Floor[] = [
    {
      id: "jobs", name: "Jobs", href: "/jobs", note: "the busiest floor",
      rooms: [{ label: "All Jobs", href: "/jobs" }, { label: "Jobs by State & District", href: "/jobs/states" }, ...categories.map((c) => ({ label: `${c.name} Jobs`, href: `/category/${c.slug}` }))],
      recentLabel: "Recent Jobs", recent: jobs.slice(0, 10).map((j) => ({ label: j.title, href: `/apply/${j.slug}` })),
    },
    { id: "results", name: "Results", href: "/results", note: "merit lists", rooms: [{ label: "All Results", href: "/results" }], recentLabel: "Recent Results", recent: results.slice(0, 10).map((r) => ({ label: r.title, href: `/result/${r.slug}` })) },
    { id: "admit-cards", name: "Admit Cards", href: "/admit-cards", note: "hall tickets", rooms: [{ label: "All Admit Cards", href: "/admit-cards" }], recentLabel: "Recent Admit Cards", recent: admitCards.slice(0, 10).map((c) => ({ label: c.title, href: `/admit-card/${c.slug}` })) },
    { id: "answer-keys", name: "Answer Keys", href: "/answer-keys", note: "check your score", rooms: [{ label: "All Answer Keys", href: "/answer-keys" }], recentLabel: "Recent Answer Keys", recent: answerKeys.slice(0, 10).map((k) => ({ label: k.title, href: `/answer-key/${k.slug}` })) },
    { id: "syllabus", name: "Syllabus", href: "/syllabus", note: "what to study", rooms: [{ label: "All Syllabus", href: "/syllabus" }], recentLabel: "Recent Syllabus", recent: syllabus.slice(0, 10).map((x) => ({ label: x.title, href: `/syllabus/${x.slug}` })) },
    { id: "admissions", name: "Admissions", href: "/admissions", note: "colleges & courses", rooms: [{ label: "All Admissions", href: "/admissions" }], recentLabel: "Recent Admissions", recent: admissions.slice(0, 10).map((x) => ({ label: x.title, href: `/admission/${x.slug}` })) },
    { id: "exam-calendar", name: "Exam Calendar", href: "/exam-calendar", note: "dates on the wall", rooms: [{ label: "Upcoming Deadlines & Exams", href: "/exam-calendar" }, { label: "Browse Active Jobs", href: "/jobs" }] },
    { id: "notifications", name: "Notifications", href: "/notifications", note: "telegrams & reads", rooms: [{ label: "All Official Notifications", href: "/notifications" }, { label: "ChayanJobs Blog", href: "/blog" }] },
    { id: "company", name: "Company", href: "/careers", note: "the people upstairs", rooms: [{ label: "About Us", href: "/about" }, { label: "Careers - Join Our Team", href: "/careers" }, { label: "Contact Us", href: "/contact" }] },
  ]
  const floorNo = (i: number) => (i === 0 ? "G" : String(i))

  return (
    <div className="home-saas mx-auto max-w-6xl px-4 pb-20 pt-10 sm:pt-14">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_460px]">
        <div className="lg:pt-6">
          <p className={cn(typeFont.className, "text-[11px] font-bold tracking-[0.3em] text-[var(--color-brick)]")}>THE LOBBY</p>
          <h1 className="mt-3 font-display text-[2.6rem] font-black leading-[1.03] text-foreground sm:text-[3.4rem]">Sitemap</h1>
          <p className="mt-3 max-w-md text-[15.5px] leading-relaxed text-muted-foreground">Browse all pages and listings available on ChayanJobs.</p>
          <p className={cn(handFont.className, "mt-2 text-[1.35rem] leading-snug text-foreground/80")}>lost? read the board, pick a floor, take the lift.</p>
        </div>

        {/* the felt letter board in the lobby */}
        <nav aria-label="Floors" className="rounded-[8px] p-2.5" style={{ background: "linear-gradient(180deg, oklch(46% 0.07 52), oklch(36% 0.06 48))", boxShadow: "0 26px 40px -26px rgb(30 15 0 / .75)" }}>
          <div className="rounded-[3px] px-5 py-5" style={{ background: "oklch(20% 0.01 60)", backgroundImage: "repeating-linear-gradient(transparent 0 7px, rgb(255 255 255 / .035) 7px 8px)" }}>
            <p className={cn(typeFont.className, "border-b border-[oklch(95%_0.01_90/0.25)] pb-2 text-center text-[12px] font-bold tracking-[0.35em] text-[oklch(95%_0.01_90)]")}>DIRECTORY · निर्देशिका</p>
            <ol className="mt-3 space-y-0.5">
              {floors.map((f, i) => (
                <li key={f.id}>
                  <a href={`#floor-${f.id}`} className={cn(typeFont.className, "group flex items-baseline gap-3 rounded-[2px] px-1.5 py-1 text-[13px] font-bold uppercase tracking-[0.12em] text-[oklch(94%_0.01_90)] transition-colors hover:bg-[oklch(95%_0.01_90/0.08)]")}>
                    <span className="w-5 text-[oklch(80%_0.12_85)]">{floorNo(i)}</span>
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="hidden flex-1 border-b border-dotted border-[oklch(95%_0.01_90/0.3)] sm:block" aria-hidden />
                    <span className="text-[oklch(80%_0.12_85)] transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>
      </div>

      {/* ── the floors ── */}
      <div className="mt-16 grid items-start gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {floors.map((f, i) => (
          <section key={f.id} id={`floor-${f.id}`} aria-labelledby={`floor-h-${f.id}`} className="scroll-mt-28">
            <div className="flex flex-col rounded-[4px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)]" style={{ boxShadow: paperShadow }}>
              <header className="flex items-center gap-3.5 border-b border-dashed border-[var(--hs-border-strong)] px-5 py-4">
                {/* the lift button for this floor */}
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-[1.05rem] font-black text-[oklch(30%_0.04_60)]"
                  style={{ background: "radial-gradient(circle at 35% 30%, oklch(92% 0.06 88), oklch(74% 0.1 78))", boxShadow: "inset 0 -2px 3px rgb(0 0 0 / .2), 0 0 0 3px oklch(55% 0.02 70 / .35)" }}
                  aria-hidden
                >
                  {floorNo(i)}
                </span>
                <div className="min-w-0">
                  <h2 id={`floor-h-${f.id}`} className="font-display text-[1.3rem] font-black leading-tight">
                    <Link href={f.href} className="text-foreground underline-offset-4 hover:text-[var(--color-brick)] hover:underline">{f.name}</Link>
                  </h2>
                  <p className={cn(handFont.className, "text-[1rem] leading-tight text-muted-foreground")}>{f.note}</p>
                </div>
              </header>
              <div className="flex-1 px-5 pb-5 pt-4">
                <ul className="space-y-1.5">
                  {f.rooms.map((r) => (
                    <li key={r.href + r.label}>
                      <Link href={r.href} className="group flex items-baseline gap-2 text-[14px] font-medium text-foreground hover:text-[var(--color-brick)]">
                        <span className="text-[var(--color-brick)]" aria-hidden>›</span>
                        <span>{r.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {f.recent && f.recent.length > 0 ? (
                  <>
                    <p className={cn(typeFont.className, "mt-4 border-t border-dashed border-[var(--hs-border)] pt-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground")}>{f.recentLabel}</p>
                    <ul className="mt-2 space-y-1">
                      {f.recent.map((r) => (
                        <li key={r.href}>
                          <Link href={r.href} className="block truncate text-[13px] text-muted-foreground hover:text-[var(--color-brick)]" title={r.label}>
                            {r.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

type Room = { label: string; href: string }
type Floor = { id: string; name: string; href: string; note: string; rooms: Room[]; recentLabel?: string; recent?: Room[] }
