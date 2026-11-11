import Link from "next/link"
import { Callout, DocSection, DocSub, InfoTable, Step, Steps, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "private-jobs",
  title: "Private jobs and your match score",
  description: "Company jobs with a trust score, a resume match score, and a pipeline to track every application.",
  group: "find",
  minutes: 6,
  toc: [
    { id: "overview", title: "What you will find" },
    { id: "trust", title: "Trust score" },
    { id: "match", title: "Resume match score" },
    { id: "page", title: "Reading a private job" },
    { id: "pipeline", title: "Your private pipeline" },
    { id: "safety", title: "Staying safe" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="overview" title="What you will find">
        <p>
          <Link href="/private-jobs">Private Jobs</Link> lists openings from companies: full-time, part-time, internships and
          contract roles, on-site, hybrid or remote. Filter by company, location and role. Some jobs are posted directly by
          verified employers through the <Link href="/docs/employer-studio">Employer Studio</Link>.
        </p>
      </DocSection>

      <DocSection id="trust" title="Trust score">
        <p>
          Every private job carries a badge so you can judge it before you share any personal details. Tap{" "}
          <UiPath items={["Why this score?"]} /> to see the reasons.
        </p>
        <InfoTable
          head={["Badge", "What it means"]}
          rows={[
            ["Verified", "The company proved it owns its work email domain."],
            ["Trusted", "Good signals: the apply link and company website match, and no scam signs were found."],
            ["Unverified", "We could not confirm the company yet. Be extra careful and check the company website yourself."],
          ]}
        />
        <p>The score is worked out from the apply link, the company’s web domain and known scam signals.</p>
      </DocSection>

      <DocSection id="match" title="Resume match score">
        <p>Upload your resume once, and every private job shows how well your skills fit it.</p>
        <Steps>
          <Step title="Go to Profile, then Resume">
            Open <UiPath items={["Profile", "Resume"]} /> and upload a PDF of your resume.
          </Step>
          <Step title="We read your skills">Skills, roles and locations are picked up from the file.</Step>
          <Step title="See your matches">
            Job pages show a match bar, and the private jobs list can suggest roles that fit you. Upload a new resume at any
            time and suggestions are worked out again.
          </Step>
        </Steps>
        <Callout tone="note">
          Your resume is used to work out your match scores and job suggestions. You can replace it at any time, and you can
          see what we store in <UiPath items={["Profile", "Data & Privacy"]} />.
        </Callout>
      </DocSection>

      <DocSection id="page" title="Reading a private job">
        <DocSub>Insights strip</DocSub>
        <p>Openings, monthly CTC range (or <em>Not disclosed</em>), work mode, location and deadline (or <em>Apply anytime</em>).</p>
        <DocSub>Prep kit</DocSub>
        <p>
          A ready-to-use email template you can copy to write to the recruiter, plus preparation pointers for the role.
        </p>
        <DocSub>Company and job description</DocSub>
        <p>What the job involves, and a link to the company website so you can check it yourself.</p>
      </DocSection>

      <DocSection id="pipeline" title="Your private pipeline">
        <p>
          Tap <UiPath items={["Track this job"]} /> to add it to your pipeline in{" "}
          <Link href="/private-applications">Private applications</Link>. Move it along as things happen:
        </p>
        <InfoTable
          head={["Stage", "Use it when"]}
          rows={[
            ["Saved", "You like the job and want to come back to it"],
            ["Applied", "You sent your application"],
            ["Shortlisted", "The company replied and you are in the next round"],
            ["Interview", "An interview is scheduled or done"],
            ["Offer", "You received an offer"],
            ["Joined", "You started the job"],
            ["Rejected / Withdrawn", "The company said no, or you stepped back"],
          ]}
        />
      </DocSection>

      <DocSection id="safety" title="Staying safe">
        <Callout tone="warning" title="Real employers do not charge you">
          Never pay for “registration”, “training”, “security deposit” or a “joining kit”. Never share OTPs or bank PINs. If a
          listing asks for money, stop and <Link href="/contact">report it</Link>.
        </Callout>
      </DocSection>
    </>
  )
}
