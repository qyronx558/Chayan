import Link from "next/link"
import { Callout, CardGrid, CardLink, DocSection, Kbd, Step, Steps, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "quick-start",
  title: "Quick start",
  description: "From your first visit to a saved, tracked job with reminders, in about ten minutes.",
  group: "start",
  minutes: 5,
  toc: [
    { id: "before", title: "Before you begin" },
    { id: "find", title: "1. Find a job for you" },
    { id: "check", title: "2. Check you are eligible" },
    { id: "save", title: "3. Save and track it" },
    { id: "apply", title: "4. Apply on the official site" },
    { id: "after", title: "5. After you apply" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="before" title="Before you begin">
        <p>You can browse everything without an account. To save jobs and get reminders, keep these ready:</p>
        <ul>
          <li>An email address you check, or a Google account.</li>
          <li>Your date of birth and highest qualification (for eligibility).</li>
          <li>Your category (General, OBC, SC, ST, EWS, PwBD), since age limits and fees depend on it.</li>
        </ul>
      </DocSection>

      <DocSection id="find" title="1. Find a job for you">
        <Steps>
          <Step title="Open the home page and use the big search box">
            Type an exam or a word you know, like <em>SSC CGL</em>, <em>Railway</em>, <em>12th pass</em> or your state.
            Matches appear as you type. Press <Kbd>Enter</Kbd> for the full results page.
          </Step>
          <Step title="Or tap your qualification">
            On the home page, tap a qualification chip such as <em>10th</em>, <em>12th</em> or <em>Graduate</em>. The list shows
            only jobs open to that level.
          </Step>
          <Step title="Narrow the list">
            On <Link href="/jobs">Gov Jobs</Link>, use the filter rail (on the left on a computer, behind the{" "}
            <UiPath items={["Filters"]} /> button on a phone) to pick a state, department or category.
          </Step>
        </Steps>
      </DocSection>

      <DocSection id="check" title="2. Check you are eligible">
        <p>Open a job. The top of the page gives you a <strong>Quick summary</strong>: vacancies, last date, fee, age limit and qualification.</p>
        <Steps>
          <Step title="Read the eligibility block">It lists the qualification, age limit and any age relaxation for your category.</Step>
          <Step title="Check your exact age">
            Open the <Link href="/tools/age-calculator">Age Calculator</Link>, enter your birth date, and use the
            <em> cut-off date</em> given in the notification (it is often not today).
          </Step>
          <Step title="Read the official notice">
            Tap <UiPath items={["Official site"]} /> or the notification PDF. Our summary is a guide; the notice is final.
          </Step>
        </Steps>
      </DocSection>

      <DocSection id="save" title="3. Save and track it">
        <Steps>
          <Step title="Create a free account">
            Tap <UiPath items={["Register"]} /> at the top right. Google sign-in is one tap. See{" "}
            <Link href="/docs/account-and-sign-in">Account and sign-in</Link>.
          </Step>
          <Step title="Bookmark the job">Tap the bookmark icon on the job. It appears in <Link href="/bookmarks">My Bookmarks</Link>.</Step>
          <Step title="Add it to your tracker">
            Set the tracker on the job page to <strong>Interested</strong>. You will get reminders 3 days before the last date
            (if reminders are on).
          </Step>
          <Step title="Turn on the alerts you want">
            Go to <UiPath items={["Profile", "Notifications"]} /> and choose which updates reach you by email or SMS.
          </Step>
        </Steps>
      </DocSection>

      <DocSection id="apply" title="4. Apply on the official site">
        <p>
          Tap <UiPath items={["Apply now"]} />. The official form opens inside the{" "}
          <Link href="/docs/official-site-viewer">official-site viewer</Link>, so your job details stay beside you while you fill it.
        </p>
        <Callout tone="tip" title="Get your documents ready first">
          Use the <strong>Documents required</strong> checklist on the job page. Resize your photo and signature to the exact
          size the form asks for with the free <Link href="/tools/photo-resizer">Photo Resizer</Link>.
        </Callout>
      </DocSection>

      <DocSection id="after" title="5. After you apply">
        <ol>
          <li>
            Move the tracker to <strong>Applied</strong>. Keep the registration number and payment receipt from the official site.
          </li>
          <li>When the admit card comes out, we notify you. Move the tracker to <strong>Admit Card</strong>.</li>
          <li>After the exam, compare your answers with the answer key and move to <strong>Exam Done</strong>.</li>
          <li>When the result is declared, move to <strong>Result Out</strong>.</li>
        </ol>
        <CardGrid>
          <CardLink href="/docs/application-tracker" title="Tracker and bookmarks">
            All the tracker stages and how reminders work.
          </CardLink>
          <CardLink href="/docs/government-jobs" title="Reading a job page">
            Every block on a job page, explained.
          </CardLink>
        </CardGrid>
      </DocSection>
    </>
  )
}
