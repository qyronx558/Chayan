import Link from "next/link"
import { Anatomy, Callout, DocSection, InfoTable, Kbd, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "official-site-viewer",
  title: "The official-site viewer",
  description: "How official websites and PDFs open inside ChayanJobs, with tabs, focus mode and your job details beside you.",
  group: "apply",
  minutes: 6,
  toc: [
    { id: "why", title: "Why it exists" },
    { id: "layout", title: "What you see" },
    { id: "tabs", title: "Tabs and the address bar" },
    { id: "focus", title: "Focus mode" },
    { id: "pdfs", title: "PDFs and downloads" },
    { id: "blocked", title: "When a site will not open inside" },
    { id: "safety", title: "Is it safe?" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="why" title="Why it exists">
        <p>
          Filling a government form means going back and forth: the form on one tab, the eligibility and fee on another. The
          viewer opens the official website <strong>inside ChayanJobs</strong>, with the job details one tap away, so you never lose
          your place.
        </p>
        <p>
          It opens when you tap <UiPath items={["Apply now"]} />, <UiPath items={["Official site"]} />, a download button, or most
          links to official websites.
        </p>
      </DocSection>

      <DocSection id="layout" title="What you see">
        <Anatomy
          title="The viewer"
          layout={[[1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [3, 4, 4, 4, 4], [3, 4, 4, 4, 4]]}
          regions={[
            { n: 1, label: "Tab strip", detail: "Each page you open gets its own tab, like a normal browser." },
            { n: 2, label: "Address bar", detail: "Shows where you are. Back, forward and reload sit beside it." },
            { n: 3, label: "Tool rail", detail: "Job details, reload website and report a problem. Collapse it for more room." },
            { n: 4, label: "Official website", detail: "The real official page. Everything you type goes to the official site." },
          ]}
        />
        <p>
          Tap <UiPath items={["Job details"]} /> to slide open the dates, fee and eligibility while the form stays open.
        </p>
      </DocSection>

      <DocSection id="tabs" title="Tabs and the address bar">
        <ul>
          <li>Links inside an official page that lead to another page open as a <strong>new tab</strong> inside the viewer.</li>
          <li>Switch tabs by tapping them; close one with its cross.</li>
          <li>Use <Kbd>Alt</Kbd> + <Kbd>←</Kbd> and <Kbd>Alt</Kbd> + <Kbd>→</Kbd> to go back and forward.</li>
        </ul>
      </DocSection>

      <DocSection id="focus" title="Focus mode">
        <p>
          Press <Kbd>F</Kbd> (or use the focus button) to hide the toolbars and give the form the whole screen. A small action dock
          stays in the corner with details, reload, download and <strong>Show toolbars</strong>. Press <Kbd>F</Kbd> again to
          come back.
        </p>
      </DocSection>

      <DocSection id="pdfs" title="PDFs and downloads">
        <p>
          Notifications, admit cards and results are often PDFs. They open in the viewer with a <strong>Download PDF</strong>{" "}
          button. If a download ever fails, the viewer offers a direct link to the original file.
        </p>
      </DocSection>

      <DocSection id="blocked" title="When a site will not open inside">
        <p>
          Some official sites refuse to be shown inside another website. When that happens, the viewer never jumps away on its
          own. It shows a card naming the organisation and the destination, and lets you choose:
        </p>
        <InfoTable
          head={["Choice", "What happens"]}
          rows={[
            ["Preview inside ChayanJobs", "A read-only copy of the page is shown inside ChayanJobs. Good for reading notices."],
            ["Continue on official site", "The official site opens in a normal browser tab. Use this to log in, fill forms or pay."],
            ["Download PDF", "Shown for documents: saves the file straight to your device."],
            ["Try direct again", "Retries loading the official page inside the viewer."],
          ]}
        />
        <p>
          Prefer normal tabs all the time? Turn on <UiPath items={["Profile", "Settings", "Open external links in new tab"]} />.
        </p>
      </DocSection>

      <DocSection id="safety" title="Is it safe?">
        <p>Yes. The viewer is built so that the official site and your ChayanJobs account stay separate:</p>
        <ul>
          <li>Preview copies run in a sealed box. They cannot read your ChayanJobs account or act as you.</li>
          <li>The viewer only opens public websites. It refuses private network addresses, which protects our servers.</li>
          <li>Your form data and payments go to the official website, not to ChayanJobs.</li>
        </ul>
        <Callout tone="important" title="Check the address before you pay">
          Before paying a fee, look at the address bar and make sure it is the recruiting body’s official domain (often ending in
          <strong> .gov.in</strong> or <strong>.nic.in</strong>). For payments and logins, <em>Continue on official site</em> is always fine.
        </Callout>
        <p>
          Something not loading? Use <UiPath items={["Report problem"]} /> in the tool rail, or see{" "}
          <Link href="/docs/faq">Troubleshooting</Link>.
        </p>
      </DocSection>
    </>
  )
}
