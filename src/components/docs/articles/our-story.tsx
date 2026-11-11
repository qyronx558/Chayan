import Link from "next/link"
import { Callout, DocSection, Timeline } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "our-story",
  title: "Our story",
  description: "Why ChayanJobs exists and how it grew, month by month, from a job board into a full career companion.",
  group: "start",
  minutes: 6,
  toc: [
    { id: "why", title: "Why we started" },
    { id: "timeline", title: "How it grew" },
    { id: "what-stayed", title: "What has not changed" },
    { id: "whats-next", title: "What comes next" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="why" title="Why we started">
        <p>
          Anyone who has prepared for a government exam knows the routine: ten browser tabs, a notebook of dates, and the worry
          that one site changed something overnight. Information was scattered, hard to read on a phone, and often copied by
          websites full of pop-ups and fake links.
        </p>
        <p>
          ChayanJobs started in <strong>July 2026</strong> with a simple idea: one clean, fast page for each recruitment, with
          the facts in plain words and a direct link to the official source. Everything since then has been built by asking
          one question: <em>what would save an aspirant time or stress today?</em>
        </p>
      </DocSection>

      <DocSection id="timeline" title="How it grew">
        <Timeline
          items={[
            {
              date: "July 2026",
              title: "Launch: the core listings",
              body: (
                <>
                  Government jobs, results, admit cards, answer keys, syllabus and admissions went live, along with the blog,
                  email sign-up and password reset. Automatic import from public feeds began, with duplicate checks so the
                  same job never shows twice. By the end of the month we added the notification system, private jobs, and
                  resume-based job suggestions.
                </>
              ),
            },
            {
              date: "August 2026",
              title: "Accounts, alerts and a review desk",
              body: (
                <>
                  Google sign-in arrived. A senior review role was created so every post from the content team is checked
                  before it goes public. Notifications became instant. We launched the <strong>application tracker</strong>{" "}
                  with deadline reminders, the redesigned profile, the <strong>exam calendar</strong>, the first-visit welcome
                  guide, smarter search, SMS alerts with phone verification, the contact form, and discussions under every post.
                </>
              ),
            },
            {
              date: "September 2026",
              title: "Free tools and a faster site",
              body: (
                <>
                  The free tools hub opened with the age calculator, salary explorer, photo resizer and eligibility checker.
                  Newsletter digests started arriving on a schedule. Search got its own page, the home page began showing what
                  you viewed recently, and official documents gained full-screen viewers. Caching made every page load faster.
                </>
              ),
            },
            {
              date: "October 2026",
              title: "Employers, the in-app browser and trust tools",
              body: (
                <>
                  The <strong>Employer Studio</strong> let verified companies post jobs for free, with a coin-reward pilot for
                  real hiring. The guided spotlight tour, careers page and endless scrolling on listings arrived. A trending
                  engine started surfacing what other aspirants are reading. The <strong>in-app browser</strong> with tabs and
                  PDF support meant official sites open without leaving ChayanJobs. Behind the scenes, a tamper-evident audit
                  log began recording every change the team makes.
                </>
              ),
            },
            {
              date: "November 2026",
              title: "Newsprint, two-step login and this Help Centre",
              body: (
                <>
                  The whole site moved to the calm <strong>Newsprint</strong> design you see now: warm paper, dark ink, one
                  red accent, easy on the eyes for long reading. Listings got a filter rail, search started ranking results by
                  relevance, and detail pages were rebuilt around the questions aspirants ask. <strong>Two-step login</strong>{" "}
                  (2FA) launched, a security review closed several gaps, the in-app browser became more reliable, and this Help
                  Centre was published.
                </>
              ),
            },
          ]}
        />
      </DocSection>

      <DocSection id="what-stayed" title="What has not changed">
        <ul>
          <li>The official source is linked on every post.</li>
          <li>Core features are free, and we never charge for selection.</li>
          <li>Pages are built phone-first, because most aspirants read on a phone.</li>
          <li>Your data is yours: you can download it or delete your account at any time.</li>
        </ul>
      </DocSection>

      <DocSection id="whats-next" title="What comes next">
        <p>
          We decide what to build next from what you tell us. If something is confusing, missing or slow, write to us through{" "}
          <Link href="/contact">the contact page</Link>. Many features in the timeline above started as a single message.
        </p>
        <Callout tone="tip">
          Curious who builds ChayanJobs, or want to join? Visit <Link href="/careers">Careers</Link> and{" "}
          <Link href="/about">About us</Link>.
        </Callout>
      </DocSection>
    </>
  )
}
