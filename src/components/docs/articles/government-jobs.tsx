import Link from "next/link"
import { Anatomy, Callout, DocSection, DocSub, InfoTable, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "government-jobs",
  title: "Government jobs",
  description: "Browse and filter Sarkari vacancies, and read every block of a job page with confidence.",
  group: "find",
  minutes: 7,
  toc: [
    { id: "listing", title: "The jobs list" },
    { id: "filters", title: "Filters" },
    { id: "status", title: "Job status labels" },
    { id: "page", title: "Anatomy of a job page" },
    { id: "blocks", title: "Each block explained" },
    { id: "share", title: "Sharing a job" },
    { id: "check", title: "Before you trust any detail" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="listing" title="The jobs list">
        <p>
          <Link href="/jobs">Gov Jobs</Link> shows every open central and state recruitment, newest first. Keep scrolling and more
          load on their own; a <strong>Load more</strong> button appears if your connection is slow. Each card shows the post,
          the department, vacancies and the last date.
        </p>
        <p>
          Shortcuts from the footer and menu take you straight to common views, such as <em>Railway jobs</em>, <em>Bank jobs</em>,
          <em> 12th pass jobs</em> or jobs in your state.
        </p>
      </DocSection>

      <DocSection id="filters" title="Filters">
        <p>
          On a computer the filter rail sits on the left. On a phone, tap <UiPath items={["Filters"]} />. Each filter you choose
          appears as a small chip above the list; tap the cross on a chip to remove it, or clear them all at once.
        </p>
        <ul>
          <li><strong>Search inside the list</strong>: press <em>/</em> to jump to it.</li>
          <li><strong>Department, category and state</strong>: searchable lists, so you can type a few letters to find yours.</li>
          <li><strong>Dates</strong>: show only jobs with a last date in the range you pick.</li>
          <li><strong>Sort</strong>: newest, closing soon, and other orders from the toolbar.</li>
        </ul>
        <Callout tone="tip">
          Filters are saved in the page address. Copy the link to share the exact same filtered list with a friend.
        </Callout>
      </DocSection>

      <DocSection id="status" title="Job status labels">
        <InfoTable
          head={["Label", "Meaning"]}
          rows={[
            ["Active", "The application window is open. You can apply now."],
            ["Closing soon", "The last date is very close. Do not wait."],
            ["Upcoming", "Announced, but applications have not started yet."],
            ["Expired / window elapsed", "The last date has passed. Kept for reference and for admit card and result updates."],
          ]}
        />
      </DocSection>

      <DocSection id="page" title="Anatomy of a job page">
        <p>Every government job page follows the same layout, so once you learn one, you can read them all.</p>
        <Anatomy
          title="A job page on a computer"
          layout={[[1, 1, 1, 1], [2, 2, 2, 3], [4, 4, 4, 3], [5, 5, 5, 3], [6, 6, 6, 0]]}
          regions={[
            { n: 1, label: "Title and status", detail: "Post name, department, status label and when it was updated." },
            { n: 2, label: "Quick summary", detail: "The two-minute version: vacancies, last date, fee, age, qualification." },
            { n: 3, label: "Apply rail", detail: "Apply now, official site, bookmark, tracker and reminders. It stays in view as you scroll." },
            { n: 4, label: "Details", detail: "Important dates, eligibility, fee, salary, selection process and how to apply." },
            { n: 5, label: "Journey and checklist", detail: "Where the recruitment is now, and the documents you need." },
            { n: 6, label: "Discussion", detail: "Questions and answers from other aspirants." },
          ]}
        />
      </DocSection>

      <DocSection id="blocks" title="Each block explained">
        <DocSub>Quick summary</DocSub>
        <p>The key numbers in one box. Read this first to decide in a minute whether the job is for you.</p>

        <DocSub>Important dates</DocSub>
        <p>
          Start date, last date to apply, fee payment last date, and exam date when known. Dates we do not have yet say{" "}
          <em>Not released yet</em>.
        </p>

        <DocSub>Eligibility</DocSub>
        <p>
          Qualification, experience, age limit and <strong>age relaxation</strong> (extra years allowed for some categories). Use
          the <Link href="/tools/eligibility-checker">Eligibility Checker</Link> if you are unsure.
        </p>

        <DocSub>Application fee and salary</DocSub>
        <p>
          Fees by category, and the pay scale or pay level. The <Link href="/tools/salary-calculator">Salary Explorer</Link>{" "}
          turns a pay level into a monthly take-home estimate.
        </p>

        <DocSub>Selection process and how to apply</DocSub>
        <p>The stages in order (for example: written exam, skill test, interview, medical) and the steps on the official site.</p>

        <DocSub>Recruitment journey</DocSub>
        <p>
          A timeline answering <em>“Where is this recruitment now?”</em>, from notification to final result. The current stage
          is marked <strong>You are here</strong>.
        </p>

        <DocSub>Documents required</DocSub>
        <p>
          A checklist of photos, certificates and IDs. Tick each one as you collect it. Your ticks are saved on this device
          only, so nobody else sees them.
        </p>

        <DocSub>Follow and reminders</DocSub>
        <p>
          The bell on the apply rail follows the job, so you get its admit card, exam and result updates even after the
          application closes.
        </p>
      </DocSection>

      <DocSection id="share" title="Sharing a job">
        <p>
          Use the share buttons to send a job on WhatsApp or Telegram, or copy the link. <strong>Job poster</strong> creates a
          clean image of the key details with the ChayanJobs logo. Preview it, then download it as a PNG to post in a group.
        </p>
      </DocSection>

      <DocSection id="check" title="Before you trust any detail">
        <Callout tone="important" title="The official notification is final">
          Recruiting bodies sometimes change dates, add posts or issue corrections. Before paying a fee, open the official
          notice from the job page and check the dates and eligibility there. If you find a difference, please{" "}
          <Link href="/contact">report it</Link> and we will correct our page.
        </Callout>
      </DocSection>
    </>
  )
}
