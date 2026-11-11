import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { DOCS_UPDATED, allDocs, docsByGroup } from "@/components/docs/registry"
import { siteConfig } from "@/lib/constants"

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
    <div className="max-w-[60rem]">
      {/* Masthead */}
      <header className="border-b-2 border-rule-2 pb-6">
        <p className="agate text-xs text-brick">ChayanJobs Help Centre</p>
        <h1 className="mt-2 text-[2.4rem] text-foreground sm:text-[3.2rem]">How ChayanJobs works, explained simply</h1>
        <p className="mt-4 max-w-[62ch] text-[1.15rem] leading-relaxed text-muted-foreground">
          Plain-language guides to every part of the site: finding the right job, reading a notification, applying on the
          official website, tracking your forms and keeping your account safe. No technical knowledge needed.
        </p>
        <p className="agate mt-4 text-xs text-muted-foreground">
          {allDocs().length} guides <span aria-hidden>·</span> about {totalMinutes} minutes in all <span aria-hidden>·</span> Last updated {updated}
        </p>
      </header>

      {/* Start paths */}
      <section aria-labelledby="paths" className="mt-10">
        <h2 id="paths" className="text-[1.5rem] text-foreground">Where would you like to start?</h2>
        <div className="mt-4 grid gap-px border border-rule bg-rule md:grid-cols-3">
          {paths.map((p) => (
            <div key={p.title} className="flex flex-col bg-paper p-5">
              <p className="agate text-xs text-muted-foreground">{p.kicker}</p>
              <p className="mt-1 font-display text-[1.2rem] font-bold leading-snug text-foreground">{p.title}</p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{p.body}</p>
              <ul className="mt-4 space-y-1.5 border-t border-rule pt-3">
                {p.links.map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={`/docs/${l.slug}`}
                      className="group flex items-center justify-between gap-2 text-[0.95rem] font-semibold text-foreground no-underline hover:text-brick"
                    >
                      {l.label}
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-brick" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Popular answers */}
      <section aria-labelledby="popular" className="news-well -mx-4 mt-10 px-4 py-6 sm:mx-0 sm:border-x sm:px-6">
        <h2 id="popular" className="text-[1.3rem] text-foreground">Quick answers</h2>
        <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {popular.map((p) => (
            <li key={p.label}>
              <Link
                href={`/docs/${p.slug}#${p.anchor}`}
                className="text-[1rem] text-ink-2 underline decoration-rule decoration-1 underline-offset-4 hover:text-brick hover:decoration-brick"
              >
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Full index, set like a newspaper contents page */}
      <section aria-labelledby="all-guides" className="mt-12">
        <div className="flex items-baseline justify-between gap-4 border-b border-rule-2 pb-2">
          <h2 id="all-guides" className="text-[1.5rem] text-foreground">All guides</h2>
          <span className="agate text-xs text-muted-foreground">{groups.length} sections</span>
        </div>
        <div className="mt-6 grid gap-x-10 gap-y-10 md:grid-cols-2">
          {groups.map((g, gi) => (
            <div key={g.id}>
              <p className="agate text-xs text-brick">{String(gi + 1).padStart(2, "0")}</p>
              <h3 className="mt-0.5 text-[1.25rem] text-foreground">{g.title}</h3>
              <p className="mt-1 text-[0.95rem] text-muted-foreground">{g.blurb}</p>
              <ul className="mt-3 border-t border-rule">
                {g.articles.map((a) => (
                  <li key={a.slug} className="border-b border-rule">
                    <Link href={`/docs/${a.slug}`} className="group flex items-baseline justify-between gap-4 py-2.5 no-underline">
                      <span className="min-w-0">
                        <span className="block font-semibold text-foreground group-hover:text-brick">{a.title}</span>
                        <span className="block text-[0.88rem] leading-snug text-muted-foreground">{a.description}</span>
                      </span>
                      <span className="agate shrink-0 text-xs text-muted-foreground">{a.minutes} min</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="mt-14 border-y-2 border-rule-2 py-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="font-display text-[1.3rem] font-bold text-foreground">Can’t find what you need?</p>
          <p className="mt-1 text-[0.98rem] text-ink-2">Our team reads every message. Tell us the page you were on and what went wrong.</p>
        </div>
        <Link
          href="/contact"
          className="mt-4 inline-flex shrink-0 items-center gap-2 bg-ink px-5 py-2.5 text-sm font-semibold text-paper no-underline hover:bg-ink-2 sm:mt-0"
        >
          Contact us <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  )
}
