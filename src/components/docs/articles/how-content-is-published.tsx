import Link from "next/link"
import { Callout, DocSection, InfoTable, Step, Steps } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "how-content-is-published",
  title: "How information reaches you",
  description: "Where our posts come from, who checks them, and how mistakes get corrected.",
  group: "trust",
  minutes: 6,
  toc: [
    { id: "journey", title: "The journey of a post" },
    { id: "sources", title: "Where information comes from" },
    { id: "review", title: "Who checks it" },
    { id: "updates", title: "When things change" },
    { id: "corrections", title: "Reporting a mistake" },
    { id: "ads", title: "Advertising and independence" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="journey" title="The journey of a post">
        <Steps>
          <Step title="An official body announces something">A commission, board, bank or university publishes a notice on its website.</Step>
          <Step title="We pick it up">
            Our content team adds it by hand, uploads it in bulk from a spreadsheet, or imports it from public feeds. Imports are
            checked for duplicates so the same job never shows twice.
          </Step>
          <Step title="We write it in plain words">The team fills in the summary, dates, eligibility and fee, and links the official notice.</Step>
          <Step title="A senior reviewer checks it">Posts by the content team wait as <em>pending</em> until a senior reviewer approves them.</Step>
          <Step title="It goes live">The post appears on the site, in search and on the calendar, and alerts go out to people who asked for them.</Step>
        </Steps>
      </DocSection>

      <DocSection id="sources" title="Where information comes from">
        <ul>
          <li>Official websites of recruiting bodies (UPSC, SSC, Railway Recruitment Boards, IBPS, state commissions and others).</li>
          <li>Official notifications, press releases and the Employment News.</li>
          <li>
            For private jobs: our team, and companies themselves through the Employer Studio. Companies must verify their work
            email first, and every private job carries a trust score.
          </li>
        </ul>
        <p>We do not invent vacancies or change official numbers. Our job is to organise them clearly.</p>
      </DocSection>

      <DocSection id="review" title="Who checks it">
        <InfoTable
          head={["Role", "What they can do"]}
          rows={[
            ["Content team (Admin)", "Create and edit their own posts. New posts wait for review."],
            ["Senior reviewer (Super Admin)", "Review, approve or reject posts from the whole team, and correct any post."],
            ["You", "Read, report mistakes, and discuss. Your reports help keep pages accurate."],
          ]}
        />
        <p>
          Every change by the team is written to an audit log. Each entry is linked to the one before, so a record cannot be
          quietly changed or removed later.
        </p>
      </DocSection>

      <DocSection id="updates" title="When things change">
        <p>
          Dates get extended, posts get added, exams get rescheduled. When that happens we update the post, and the page shows
          when it was last updated. If you follow or track the job, you are notified.
        </p>
      </DocSection>

      <DocSection id="corrections" title="Reporting a mistake">
        <p>
          Found a wrong date, a broken link or a missing detail? Use the <Link href="/contact">contact page</Link> and tell us the
          page and what is wrong, with a link to the official source if you have it. Reported errors are reviewed within 24 hours and
          corrected as soon as they are confirmed.
        </p>
        <Callout tone="important">
          Even with careful checking, the official notification is always the final word. Please check it before you pay or apply.
        </Callout>
      </DocSection>

      <DocSection id="ads" title="Advertising and independence">
        <p>
          Some pages show clearly labelled advertisements. Advertisers have no say in what we publish, and we do not publish paid
          posts dressed up as news. Read our <Link href="/editorial-policy">Editorial Policy</Link> and{" "}
          <Link href="/disclaimer">Disclaimer</Link>.
        </p>
      </DocSection>
    </>
  )
}
