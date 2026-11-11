import Link from "next/link"
import { CardGrid, CardLink, Callout, DocSection, InfoTable } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "introduction",
  title: "Welcome to ChayanJobs",
  description: "What ChayanJobs is, who it is for, and what you can do here in one visit.",
  group: "start",
  minutes: 4,
  toc: [
    { id: "what-it-is", title: "What ChayanJobs is" },
    { id: "who-its-for", title: "Who it is for" },
    { id: "what-you-can-do", title: "What you can do here" },
    { id: "the-promise", title: "Three promises we keep" },
    { id: "free", title: "What it costs" },
    { id: "where-next", title: "Where to go next" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="what-it-is" title="What ChayanJobs is">
        <p>
          ChayanJobs is one place to follow a job, from the day it is announced to the day the result comes out. <em>Chayan</em>{" "}
          (चयन) means <strong>selection</strong>, and our line is <em>select right, serve right</em>.
        </p>
        <p>
          Government recruitment in India is spread across hundreds of websites: UPSC, SSC, the Railway boards, banks, every
          state commission, and many more. Each one posts its own notice, admit card and result. Missing one date can mean waiting
          another year. ChayanJobs brings these updates together, puts them in a clear format, and always links back to the
          official source so you can check it yourself.
        </p>
        <p>We also list private company jobs, so one account covers both kinds of career.</p>
      </DocSection>

      <DocSection id="who-its-for" title="Who it is for">
        <ul>
          <li>
            <strong>Students and job seekers</strong> preparing for government exams (10th pass to post-graduate) who want every
            update in one place.
          </li>
          <li>
            <strong>Parents and guardians</strong> who help someone at home keep track of forms, fees and dates.
          </li>
          <li>
            <strong>Working professionals</strong> looking at private jobs, with a resume-based match score.
          </li>
          <li>
            <strong>Companies and HR teams</strong> who want to post jobs for free through the{" "}
            <Link href="/docs/employer-studio">Employer Studio</Link>.
          </li>
        </ul>
        <p>You do not need to be good with computers. If you can use WhatsApp, you can use ChayanJobs.</p>
      </DocSection>

      <DocSection id="what-you-can-do" title="What you can do here">
        <InfoTable
          head={["Section", "What you get", "Where"]}
          rows={[
            ["Government jobs", "New vacancies with eligibility, fees, dates and the official notice", <Link key="j" href="/jobs">/jobs</Link>],
            ["Private jobs", "Company jobs with a trust score and a resume match score", <Link key="p" href="/private-jobs">/private-jobs</Link>],
            ["Admit cards", "Hall ticket release news and the download link", <Link key="a" href="/admit-cards">/admit-cards</Link>],
            ["Answer keys", "Official keys to check your answers and estimate your score", <Link key="k" href="/answer-keys">/answer-keys</Link>],
            ["Results", "Result and merit-list announcements", <Link key="r" href="/results">/results</Link>],
            ["Syllabus", "Topic-wise syllabus with a checklist you can tick", <Link key="s" href="/syllabus">/syllabus</Link>],
            ["Admissions", "University and course admission notices", <Link key="ad" href="/admissions">/admissions</Link>],
            ["Exam calendar", "Every last date, exam date, admit card and result on a monthly calendar", <Link key="c" href="/exam-calendar">/exam-calendar</Link>],
            ["Free tools", "Age calculator, salary explorer, photo resizer, eligibility checker", <Link key="t" href="/tools">/tools</Link>],
            ["Blog", "Preparation guides and explainers", <Link key="b" href="/blog">/blog</Link>],
          ]}
        />
      </DocSection>

      <DocSection id="the-promise" title="Three promises we keep">
        <ol>
          <li>
            <strong>The official source is always one tap away.</strong> Every post links to the original notice or website. Our
            summary helps you read faster; the official notice is what counts.
          </li>
          <li>
            <strong>A person checks the news before it goes up.</strong> New posts from our content team are reviewed before they
            go live. See <Link href="/docs/how-content-is-published">How information reaches you</Link>.
          </li>
          <li>
            <strong>You stay on a safe page.</strong> Official sites open in our <Link href="/docs/official-site-viewer">official-site viewer</Link>, so you
            never lose your place, and those sites can never act as you on ChayanJobs.
          </li>
        </ol>
      </DocSection>

      <DocSection id="free" title="What it costs">
        <p>
          Reading, searching, alerts, the tracker and all the tools are free. You only need a free account to save things or get
          alerts. Application fees are paid to the recruiting body on its own website, never to ChayanJobs.
        </p>
        <Callout tone="warning" title="We never ask for money to get you a job">
          No one from ChayanJobs will ever ask you to pay to get selected, to “confirm” a seat, or to unlock a result. If someone
          does, it is a scam. Please <Link href="/contact">tell us</Link>.
        </Callout>
      </DocSection>

      <DocSection id="where-next" title="Where to go next">
        <CardGrid>
          <CardLink href="/docs/quick-start" title="Quick start">
            Find a job you are eligible for and save it, in ten minutes.
          </CardLink>
          <CardLink href="/docs/finding-your-way" title="Finding your way around">
            The menu, search, dark mode and the guided tour.
          </CardLink>
          <CardLink href="/docs/our-story" title="Our story">
            How ChayanJobs was built, month by month.
          </CardLink>
          <CardLink href="/docs/glossary" title="Glossary">
            Plain meanings of words like cut-off, admit card and pay level.
          </CardLink>
        </CardGrid>
      </DocSection>
    </>
  )
}
