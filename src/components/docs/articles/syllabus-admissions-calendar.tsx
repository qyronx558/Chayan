import Link from "next/link"
import { Callout, DocSection, DocSub, InfoTable, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "syllabus-admissions-calendar",
  title: "Syllabus, admissions and the exam calendar",
  description: "Plan your preparation with topic checklists, follow admissions, and see every date on one calendar.",
  group: "find",
  minutes: 5,
  toc: [
    { id: "syllabus", title: "Syllabus" },
    { id: "admissions", title: "Admissions" },
    { id: "calendar", title: "Exam calendar" },
    { id: "calendar-tips", title: "Calendar tips" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="syllabus" title="Syllabus">
        <p>
          <Link href="/syllabus">Syllabus</Link> breaks each exam into papers and topics, along with the exam pattern (number of
          questions, marks and time) when the official syllabus gives it.
        </p>
        <DocSub>Topic checklist</DocSub>
        <p>
          Tick topics as you finish them to see your progress. Signed-in users can also bookmark a syllabus to find it again
          from <Link href="/bookmarks">My Bookmarks</Link>.
        </p>
        <Callout tone="tip">Syllabi change between years. Check the year on the post matches the exam you are preparing for.</Callout>
      </DocSection>

      <DocSection id="admissions" title="Admissions">
        <p>
          <Link href="/admissions">Admissions</Link> covers university, college and course admission notices: entrance tests,
          counselling rounds and application windows. Admissions can be added to your tracker just like jobs.
        </p>
      </DocSection>

      <DocSection id="calendar" title="Exam calendar">
        <p>
          The <Link href="/exam-calendar">Exam Calendar</Link> places every important date on a monthly grid, so you can see a
          busy month coming.
        </p>
        <InfoTable
          head={["Marker", "Meaning"]}
          rows={[
            ["Last Date", "The final day to submit an application"],
            ["Exam", "The day an exam is held"],
            ["Admit Card", "The day hall tickets are released"],
            ["Result", "The day a result is declared"],
          ]}
        />
        <ul>
          <li>Move with <strong>previous</strong> and <strong>next</strong>, jump to any month, or tap <strong>Today</strong> to come back.</li>
          <li>Type an exam or department (SSC, UPSC, Railway) in the calendar search to show only those events.</li>
          <li>Use the type filters to show only last dates, exams, admit cards or results. Counts update as you filter.</li>
          <li>Tap a highlighted day to jump to that day in the schedule below the grid.</li>
          <li>When a day has many events, tap <strong>+ more</strong> to see all of them.</li>
        </ul>
      </DocSection>

      <DocSection id="calendar-tips" title="Calendar tips">
        <ul>
          <li>The schedule under the grid labels events <em>Today</em>, <em>Tomorrow</em> or <em>In X days</em>.</li>
          <li>The calendar address changes as you move and filter. Copy it to share the same view.</li>
          <li>
            Want reminders instead of checking? Add jobs to your tracker and turn on deadline reminders in{" "}
            <UiPath items={["Profile", "Notifications"]} />.
          </li>
        </ul>
      </DocSection>
    </>
  )
}
