import Link from "next/link"
import { Callout, DocSection, InfoTable, Step, Steps, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "results-admit-cards-answer-keys",
  title: "Admit cards, answer keys and results",
  description: "What happens after you apply: download your hall ticket, check your answers, and find your result.",
  group: "find",
  minutes: 6,
  toc: [
    { id: "order", title: "The order things happen" },
    { id: "admit-cards", title: "Admit cards" },
    { id: "answer-keys", title: "Answer keys" },
    { id: "results", title: "Results" },
    { id: "viewer", title: "Opening documents" },
    { id: "alerts", title: "Getting told first" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="order" title="The order things happen">
        <p>Almost every recruitment follows the same path. ChayanJobs has a section for each step.</p>
        <InfoTable
          head={["Stage", "What it is", "Section"]}
          rows={[
            ["1. Notification", "The job is announced and the form opens", <Link key="1" href="/jobs">Gov Jobs</Link>],
            ["2. Admit card", "Your hall ticket with exam date, time and centre", <Link key="2" href="/admit-cards">Admit Cards</Link>],
            ["3. Exam", "You sit the test", <Link key="3" href="/exam-calendar">Exam Calendar</Link>],
            ["4. Answer key", "The correct answers, so you can estimate your marks", <Link key="4" href="/answer-keys">Answer Keys</Link>],
            ["5. Result", "Who qualified, cut-off marks and merit list", <Link key="5" href="/results">Results</Link>],
          ]}
        />
      </DocSection>

      <DocSection id="admit-cards" title="Admit cards">
        <p>
          When a hall ticket is released, it appears in <Link href="/admit-cards">Admit Cards</Link> with the exam it belongs to,
          the release date and a download button.
        </p>
        <Steps>
          <Step title="Open the admit card post">Check it is for your exam and your post. Some exams release cards region by region.</Step>
          <Step title="Tap Download">The official download page opens in the viewer. Log in there with your registration number and password or date of birth.</Step>
          <Step title="Save and print">Download the PDF and print it. Check your photo, name, centre address and reporting time.</Step>
        </Steps>
        <Callout tone="warning" title="Admit cards come only from the official site">
          ChayanJobs never sends your admit card by WhatsApp or email. You always download it from the recruiting body’s
          website, through the link on our page.
        </Callout>
      </DocSection>

      <DocSection id="answer-keys" title="Answer keys">
        <p>
          A few days after the exam, most bodies publish a <strong>provisional</strong> answer key. You can usually raise an
          <strong> objection</strong> (with a small fee) if you think an answer is wrong. A <strong>final</strong> key comes later.
        </p>
        <ul>
          <li>Open the key post from <Link href="/answer-keys">Answer Keys</Link>.</li>
          <li>Note the objection window dates, shown on the page when available.</li>
          <li>Compare with your response sheet to estimate your score, using the marking scheme in the notification (including negative marking).</li>
        </ul>
      </DocSection>

      <DocSection id="results" title="Results">
        <p>
          <Link href="/results">Results</Link> lists declared results and merit lists. A result post tells you which stage it is
          for (for example, Tier 1 or final), and links to the official result PDF or login page. Cut-off marks are listed
          when the recruiting body publishes them.
        </p>
      </DocSection>

      <DocSection id="viewer" title="Opening documents">
        <p>
          Admit cards, answer keys, results, syllabi and admission notices all have a <strong>full-screen view</strong>. PDFs
          open right inside ChayanJobs, with buttons to download, reload or open the original. Read more in{" "}
          <Link href="/docs/official-site-viewer">The official-site viewer</Link>.
        </p>
      </DocSection>

      <DocSection id="alerts" title="Getting told first">
        <p>
          Add the job to your tracker or tap the bell on its page. Then turn on <em>Admit cards</em>, <em>Answer keys</em> and{" "}
          <em>Results</em> in <UiPath items={["Profile", "Notifications"]} />. You will get a notification the moment we publish
          the update.
        </p>
      </DocSection>
    </>
  )
}
