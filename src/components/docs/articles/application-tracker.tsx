import Link from "next/link"
import { Callout, DocSection, InfoTable, Step, Steps, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "application-tracker",
  title: "Application tracker and bookmarks",
  description: "Keep every form you fill in one list, move it through each stage, and get reminded before anything is due.",
  group: "apply",
  minutes: 5,
  toc: [
    { id: "difference", title: "Bookmark or track?" },
    { id: "stages", title: "Tracker stages" },
    { id: "how", title: "Tracking a job" },
    { id: "reminders", title: "Reminders" },
    { id: "bookmarks", title: "My Bookmarks" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="difference" title="Bookmark or track?">
        <InfoTable
          head={["", "Bookmark", "Track"]}
          rows={[
            ["Use it for", "Anything you want to read again", "A job or admission you are applying for"],
            ["Works with", "Jobs, private jobs, results, admit cards, syllabi", "Government jobs and admissions"],
            ["Reminders", "No", "Yes: last date, admit card and result"],
            ["Find it in", <Link key="b" href="/bookmarks">My Bookmarks</Link>, <Link key="a" href="/applications">My Applications</Link>],
          ]}
        />
        <p>Both need a free account. Private jobs have their own pipeline, explained in <Link href="/docs/private-jobs">Private jobs</Link>.</p>
      </DocSection>

      <DocSection id="stages" title="Tracker stages">
        <InfoTable
          head={["Stage", "Move it here when"]}
          rows={[
            ["Interested", "You plan to apply"],
            ["Applied", "You submitted the form and paid the fee"],
            ["Admit Card", "Your hall ticket is out"],
            ["Exam Done", "You sat the exam"],
            ["Result Out", "The result is declared"],
          ]}
        />
        <p>My Applications groups your jobs by stage, so you can see at a glance what needs your attention.</p>
      </DocSection>

      <DocSection id="how" title="Tracking a job">
        <Steps>
          <Step title="Open the job or admission page" />
          <Step title="Tap Track on the apply rail">Choose the stage that fits right now, usually <em>Interested</em>.</Step>
          <Step title="Update as you go">Change the stage from the job page or from My Applications.</Step>
          <Step title="Stop tracking">Remove a job from My Applications with <UiPath items={["Stop tracking"]} /> when you no longer need it.</Step>
        </Steps>
      </DocSection>

      <DocSection id="reminders" title="Reminders">
        <p>For tracked jobs we remind you about:</p>
        <ul>
          <li>The application last date, <strong>3 days before</strong>.</li>
          <li>The admit card release.</li>
          <li>The result.</li>
        </ul>
        <p>
          Choose how reminders reach you (email or SMS) in <UiPath items={["Profile", "Notifications"]} />. The time
          zone for reminders is set in <UiPath items={["Profile", "Settings", "Region & time"]} />.
        </p>
        <Callout tone="tip">Keep the stage up to date, so My Applications always shows what is really next for you.</Callout>
      </DocSection>

      <DocSection id="bookmarks" title="My Bookmarks">
        <p>
          Tap the bookmark icon on any card or page. <Link href="/bookmarks">My Bookmarks</Link> sorts saved items into tabs: jobs,
          results, admit cards, private jobs and syllabi. Tap the icon again, or remove it from the list, to un-save.
        </p>
      </DocSection>
    </>
  )
}
