import Link from "next/link"
import { Callout, DocSection, InfoTable, Kbd } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "search",
  title: "Search",
  description: "Find any job, result, admit card, answer key, syllabus or article from one box.",
  group: "find",
  minutes: 4,
  toc: [
    { id: "where", title: "Where to search" },
    { id: "quick", title: "Quick search" },
    { id: "page", title: "The search page" },
    { id: "good-searches", title: "Searches that work well" },
    { id: "nothing", title: "When nothing comes up" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="where" title="Where to search">
        <p>One search covers the whole site: government and private jobs, results, admit cards, answer keys, syllabi, admissions and blog posts. You can start from:</p>
        <ul>
          <li>The search box in the header, or <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> from any page.</li>
          <li>The large search box on the home page.</li>
          <li>The <Link href="/search">search page</Link>, for the full list of results.</li>
        </ul>
      </DocSection>

      <DocSection id="quick" title="Quick search">
        <p>
          Matches appear as you type. Use <Kbd>↑</Kbd> and <Kbd>↓</Kbd> to move, <Kbd>Enter</Kbd> to open, and <Kbd>Esc</Kbd> to
          close. Press <Kbd>Enter</Kbd> without choosing a result to see everything on the search page.
        </p>
      </DocSection>

      <DocSection id="page" title="The search page">
        <ul>
          <li>
            Results are <strong>ranked by relevance</strong>: posts whose title matches your words rank highest, and newer and
            popular posts get a lift.
          </li>
          <li>Narrow results to one type (such as only jobs or only results), change the sort order, limit by date, or tick <em>open only</em> to hide closed posts.</li>
          <li>On a computer, a <strong>preview pane</strong> shows the key details of a result before you open it.</li>
          <li>Press <Kbd>/</Kbd> to return to the search box. The address updates as you search, so you can share it.</li>
        </ul>
      </DocSection>

      <DocSection id="good-searches" title="Searches that work well">
        <InfoTable
          head={["Try", "To find"]}
          rows={[
            ["SSC CGL", "A specific exam"],
            ["Railway, Bank, Police, Defence", "A whole sector"],
            ["10th, 12th, ITI, Graduate", "Jobs for a qualification"],
            ["Bihar, Rajasthan, Delhi", "Jobs in a state"],
            ["UPSC admit card", "One exam’s admit card"],
            ["NEET result", "One exam’s result"],
          ]}
        />
      </DocSection>

      <DocSection id="nothing" title="When nothing comes up">
        <ul>
          <li>Check the spelling, or use a shorter word (<em>Railway</em> instead of <em>Railway Recruitment Board Group D</em>).</li>
          <li>Try the short name everyone uses (<em>CHSL</em>, <em>NTPC</em>, <em>PO</em>).</li>
          <li>The post may not be announced yet. Check the <Link href="/exam-calendar">Exam Calendar</Link> for expected dates.</li>
        </ul>
        <Callout tone="tip">
          Still not there? <Link href="/contact">Tell us</Link> what you were looking for. It helps us add missing recruitments.
        </Callout>
      </DocSection>
    </>
  )
}
