import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { DOCS_UPDATED, allDocs, docsByGroup } from "@/components/docs/registry"
import { siteConfig } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import "@/app/home.css"

export const metadata: Metadata = {
  title: "Help Centre",
  description:
    "The ChayanJobs Help Centre: plain-language guides to finding jobs, reading notifications, tracking applications, alerts, account security and the Employer Studio.",
  alternates: { canonical: `${siteConfig.url}/docs` },
  openGraph: {
    title: "ChayanJobs Help Centre",
    description: "Everything about how ChayanJobs works, explained simply.",
    url: `${siteConfig.url}/docs`,
  },
}

const paths = [
  {
    kicker: "New here",
    title: "I want to understand ChayanJobs",
    body: "What the site does, how it began, and a ten-minute walk-through.",
    links: [
      { slug: "introduction", label: "Welcome to ChayanJobs" },
      { slug: "quick-start", label: "Quick start" },
      { slug: "our-story", label: "Our story" },
    ],
  },
  {
    kicker: "Applying",
    title: "I am filling a form right now",
    body: "Read the job page, check eligibility, get documents ready and apply safely.",
    links: [
      { slug: "government-jobs", label: "Reading a job page" },
      { slug: "official-site-viewer", label: "The official-site viewer" },
      { slug: "free-tools", label: "Age calculator and photo resizer" },
    ],
  },
  {
    kicker: "Hiring",
    title: "I represent a company",
    body: "Verify your company, post jobs for free, and earn coins for real hires.",
    links: [
      { slug: "employer-studio", label: "Employer Studio" },
      { slug: "private-jobs", label: "How job seekers see your jobs" },
    ],
  },
]

const popular = [
  { slug: "account-and-sign-in", anchor: "forgot", label: "I forgot my password" },
  { slug: "security-and-privacy", anchor: "two-step", label: "Turn on two-step login" },
  { slug: "alerts-and-newsletter", anchor: "alerts", label: "Choose which alerts I get" },
  { slug: "application-tracker", anchor: "stages", label: "Track an application" },
  { slug: "results-admit-cards-answer-keys", anchor: "admit-cards", label: "Download an admit card" },
  { slug: "faq", anchor: "pages", label: "Official site is blank" },
]

/* The help centre is the enquiry counter: the window at the station or the
 * exam board office where you queue with your question and someone patient
 * answers it. Each start path is a counter window; the full index is a
 * well-thumbed guidebook with coloured tabs on its edge. */
const TAB_HUES = [28, 250, 155, 70, 310, 200, 120, 0]

export default function DocsHomePage() {
  const groups = docsByGroup()
  const totalMinutes = allDocs().reduce((s, a) => s + a.meta.minutes, 0)
  const updated = new Date(`${DOCS_UPDATED}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  })

  return (
    <div className="home-saas max-w-[60rem] text-foreground">
      {/* Masthead: the enquiry board */}
      <header className="relative">
        <div className="inline-flex flex-col items-center rounded-[4px] border-[3px] border-[oklch(30%_0.02_250)] bg-[oklch(38%_0.09_250)] px-5 py-1.5 text-[oklch(97%_0.01_90)] shadow-[0_6px_14px_-8px_rgb(0_0_0/.5)]">
          <span className="text-[1.15rem] font-bold leading-tight" lang="hi">पूछताछ</span>
          <span className={cn(typeFont.className, "text-[11px] font-bold tracking-[0.35em]")}>ENQUIRY</span>
        </div>
        <h1 className="mt-5 font-display text-[2.4rem] font-black leading-[1.05] text-foreground sm:text-[3.2rem]">
          Ask at the counter. We&apos;ll explain it simply.
        </h1>
        <p className="mt-4 max-w-[62ch] text-[1.1rem] leading-relaxed text-muted-foreground">
          Plain-language guides to every part of the site: finding the right job, reading a notification, applying on the
          official website, tracking your forms and keeping your account safe. No technical knowledge needed.
        </p>
        <p className={cn(typeFont.className, "mt-4 text-[11.5px] text-muted-foreground")}>
          {allDocs().length} guides <span aria-hidden>·</span> about {totalMinutes} minutes in all <span aria-hidden>·</span> last updated {updated}
        </p>
      </header>

      {/* Start paths: three counter windows */}
      <section aria-labelledby="paths" className="mt-12">
        <h2 id="paths" className="font-display text-[1.5rem] font-black text-foreground">Where would you like to start?</h2>
        <p className={cn(handFont.className, "text-[1.1rem] text-muted-foreground")}>pick the window that fits. no queue today.</p>
        <div className="mt-5 grid gap-6 md:grid-cols-3">
          {paths.map((p, i) => (
            <div key={p.title} className="flex flex-col">
              {/* window frame with the board above it */}
              <div className="rounded-t-[10px] border-x-[3px] border-t-[3px] border-[oklch(45%_0.05_60)] bg-[oklch(50%_0.06_60)] px-3 py-1.5 text-center text-[oklch(97%_0.01_90)]">
                <span className={cn(typeFont.className, "text-[11px] font-bold tracking-[0.2em]")}>WINDOW {i + 1} · {p.kicker.toUpperCase()}</span>
              </div>
              <div className="flex flex-1 flex-col border-x-[3px] border-b-[3px] border-[oklch(45%_0.05_60)] bg-[var(--hs-paper-slip)]">
                {/* the glass, with the little speaking hole */}
                <div className="relative border-b border-dashed border-[var(--hs-border-strong)] px-4 pb-4 pt-4" style={{ background: "linear-gradient(115deg, transparent 0 40%, color-mix(in oklch, oklch(90% 0.03 220) 9%, transparent) 40% 46%, transparent 46% 58%, color-mix(in oklch, oklch(90% 0.03 220) 6%, transparent) 58% 61%, transparent 61%)" }}>
                  <span className="absolute right-3 top-3 grid grid-cols-3 gap-[3px] opacity-50" aria-hidden>
                    {Array.from({ length: 9 }).map((_, k) => <span key={k} className="h-1 w-1 rounded-full bg-foreground" />)}
                  </span>
                  <p className="pr-8 font-display text-[1.15rem] font-bold leading-snug text-foreground">&ldquo;{p.title}&rdquo;</p>
                  <p className="mt-2 text-[0.93rem] leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
                <ul className="flex-1 space-y-1 px-4 pb-4 pt-3">
                  {p.links.map((l) => (
                    <li key={l.slug}>
                      <Link href={`/docs/${l.slug}`} className="group flex items-center justify-between gap-2 py-0.5 text-[0.95rem] font-semibold text-foreground no-underline hover:text-[var(--color-brick)]">
                        {l.label}
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-brick)]" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick answers: token slips from the counter */}
      <section aria-labelledby="popular" className="mt-14">
        <h2 id="popular" className="font-display text-[1.35rem] font-black text-foreground">Asked at the counter every day</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((p, i) => (
            <li key={p.label} className={cn(i % 3 === 1 ? "rotate-[0.6deg]" : i % 3 === 2 ? "-rotate-[0.5deg]" : "")}>
              <Link
                href={`/docs/${p.slug}#${p.anchor}`}
                className="group relative flex items-center gap-3 rounded-[2px] bg-[oklch(95%_0.04_90)] py-3 pl-3 pr-4 text-[oklch(28%_0.03_60)] no-underline transition-transform hover:-translate-y-0.5"
                style={{ boxShadow: "0 1px 1px rgb(60 40 10 / .1), 0 10px 18px -14px rgb(60 40 10 / .55)" }}
              >
                {/* token number, torn off at the dotted line */}
                <span className={cn(typeFont.className, "flex h-10 w-10 shrink-0 flex-col items-center justify-center border-r-2 border-dotted border-[oklch(50%_0.05_60/0.5)] pr-3 text-center")}>
                  <span className="text-[8.5px] font-bold opacity-60">TOKEN</span>
                  <span className="text-[1.05rem] font-bold leading-none text-[oklch(48%_0.18_28)]">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className="text-[0.97rem] font-semibold leading-snug group-hover:underline group-hover:underline-offset-2">{p.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Full index: a guidebook with coloured thumb tabs */}
      <section aria-labelledby="all-guides" className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className={cn(handFont.className, "text-[1.15rem] text-[var(--color-brick)]")}>the whole guidebook</p>
            <h2 id="all-guides" className="font-display text-[1.6rem] font-black leading-tight text-foreground">All guides</h2>
          </div>
          <span className={cn(typeFont.className, "text-[11px] text-muted-foreground")}>{groups.length} sections</span>
        </div>
        <div className="mt-6 grid gap-x-8 gap-y-8 md:grid-cols-2">
          {groups.map((g, gi) => {
            const hue = TAB_HUES[gi % TAB_HUES.length]
            const tab = `oklch(${hue === 70 ? 72 : 58}% 0.13 ${hue})`
            return (
              <div key={g.id} className="relative rounded-[2px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] pb-3 pl-5 pr-9 pt-4" style={{ boxShadow: "0 1px 2px rgb(60 40 10 / .08), 0 16px 28px -22px rgb(60 40 10 / .55)" }}>
                {/* thumb tab sticking out of the page edge */}
                <span className={cn(typeFont.className, "absolute right-0 top-4 flex h-14 w-6 items-center justify-center rounded-l-[5px] text-[11px] font-bold text-[oklch(98%_0.01_90)]")} style={{ background: tab, boxShadow: "1px 1px 2px rgb(0 0 0 / .2)" }} aria-hidden>
                  <span className="rotate-90">{String(gi + 1).padStart(2, "0")}</span>
                </span>
                <h3 className="font-display text-[1.2rem] font-bold leading-tight text-foreground">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: tab }} aria-hidden />
                  {g.title}
                </h3>
                <p className="mt-1 text-[0.92rem] text-muted-foreground">{g.blurb}</p>
                <ul className="mt-3">
                  {g.articles.map((a) => (
                    <li key={a.slug} className="border-t border-dotted border-[var(--hs-border-strong)]">
                      <Link href={`/docs/${a.slug}`} className="group flex items-baseline justify-between gap-4 py-2.5 no-underline">
                        <span className="min-w-0">
                          <span className="block font-semibold text-foreground group-hover:text-[var(--color-brick)] group-hover:underline group-hover:underline-offset-2">{a.title}</span>
                          <span className="block text-[0.86rem] leading-snug text-muted-foreground">{a.description}</span>
                        </span>
                        <span className={cn(typeFont.className, "shrink-0 text-[11px] text-muted-foreground")}>{a.minutes} min</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* Contact: ring the bell */}
      <section className="mt-16 flex flex-col gap-5 rounded-[3px] border-2 border-dashed border-[var(--hs-border-strong)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 64 48" className="h-12 w-16 shrink-0" aria-hidden>
            <rect x="26" y="2" width="12" height="6" rx="3" fill="oklch(55% 0.02 250)" />
            <path d="M8 38 C 8 18, 20 9, 32 9 C 44 9, 56 18, 56 38 Z" fill="oklch(78% 0.12 85)" stroke="oklch(55% 0.1 75)" strokeWidth="1.5" />
            <path d="M18 22 C 22 16, 27 14, 31 13" stroke="oklch(95% 0.05 90)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <rect x="2" y="38" width="60" height="7" rx="2" fill="oklch(40% 0.03 60)" />
          </svg>
          <div>
            <p className="font-display text-[1.3rem] font-bold text-foreground">Can&rsquo;t find what you need?</p>
            <p className="mt-0.5 text-[0.98rem] text-muted-foreground">Our team reads every message. Tell us the page you were on and what went wrong.</p>
          </div>
        </div>
        <Link href="/contact" className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-semibold text-[var(--color-paper)] no-underline transition-transform hover:-translate-y-0.5 sm:self-auto">
          Ring the bell: contact us <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  )
}
