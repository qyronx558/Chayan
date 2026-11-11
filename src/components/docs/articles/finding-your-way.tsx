import Link from "next/link"
import { Anatomy, Callout, DocSection, InfoTable, Kbd, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "finding-your-way",
  title: "Finding your way around",
  description: "The header, menus, home page sections, dark mode, the guided tour and keyboard shortcuts.",
  group: "start",
  minutes: 5,
  toc: [
    { id: "header", title: "The header" },
    { id: "home", title: "The home page" },
    { id: "phone", title: "On a phone" },
    { id: "theme", title: "Light and dark mode" },
    { id: "tour", title: "The guided tour" },
    { id: "shortcuts", title: "Keyboard shortcuts" },
    { id: "footer", title: "The footer" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="header" title="The header">
        <p>The bar at the top of every page is the same everywhere, so you can always get back to where you need to be.</p>
        <Anatomy
          title="Header on a computer"
          layout={[[1, 2, 2, 2, 2, 2, 3, 4, 5]]}
          regions={[
            { n: 1, label: "Logo", detail: "Takes you back to the home page." },
            { n: 2, label: "Main menu", detail: "Home, Jobs, Results, Admit Cards, Answer Keys, Tools and More." },
            { n: 3, label: "Search", detail: "Searches every section at once. Shortcut: Ctrl + K." },
            { n: 4, label: "Bell and theme", detail: "Your notifications, and the light or dark switch." },
            { n: 5, label: "Account", detail: "Log in or Register. Once signed in: Profile, Applications, Bookmarks, Sign out." },
          ]}
        />
        <InfoTable
          head={["Menu", "What is inside"]}
          rows={[
            ["Jobs", "Gov Jobs, Private Jobs, and For Employers"],
            ["Results / Admit Cards / Answer Keys", "Direct links to each listing"],
            ["Tools", "All free tools, Age Calculator, Salary Explorer, Photo Resizer, Eligibility Checker"],
            ["More", "Syllabus, Admissions, Exam Calendar, Blog, Notifications, Careers, Help Centre"],
          ]}
        />
      </DocSection>

      <DocSection id="home" title="The home page">
        <p>The home page is arranged like the front page of a newspaper: the most urgent things first.</p>
        <ul>
          <li><strong>Search and popular searches</strong>: start typing, or tap a search other aspirants use often.</li>
          <li><strong>Quick access</strong>: one tap to each section.</li>
          <li><strong>Qualification chips</strong>: 10th, 12th, ITI, Diploma, Graduate and more. Tap to see jobs for that level.</li>
          <li><strong>Upcoming deadlines</strong>: last dates, exams, admit cards and results coming up soon.</li>
          <li><strong>Latest and Trending</strong>: switch tabs to see what is newest or what is being read most.</li>
          <li><strong>Continue exploring</strong>: the posts you viewed recently on this device.</li>
        </ul>
      </DocSection>

      <DocSection id="phone" title="On a phone">
        <p>
          Tap the menu icon at the top left to open the full menu, including your account links. Search stays at the top of the
          screen. On listing pages, the <UiPath items={["Filters"]} /> button opens the filter panel from the side.
        </p>
      </DocSection>

      <DocSection id="theme" title="Light and dark mode">
        <p>
          Tap the sun or moon icon in the header to switch. New visitors start in light mode. Dark mode is easier on the eyes at
          night. Signed-in users can also change font size, density, contrast and motion in{" "}
          <UiPath items={["Profile", "Settings"]} />.
        </p>
      </DocSection>

      <DocSection id="tour" title="The guided tour">
        <p>
          On your first visit, a short welcome guide and a spotlight tour point out the search box, popular searches, sections,
          qualification filter and deadlines. The exam calendar has its own tour too.
        </p>
        <p>
          Skipped it? Use the <strong>tour replay</strong> button in the footer to run it again at any time.
        </p>
      </DocSection>

      <DocSection id="shortcuts" title="Keyboard shortcuts">
        <InfoTable
          head={["Keys", "What it does", "Where"]}
          rows={[
            [<><Kbd>Ctrl</Kbd> + <Kbd>K</Kbd></>, "Open search (⌘ + K on a Mac)", "Every page"],
            [<Kbd key="s">/</Kbd>, "Jump to the search or filter box", "Search page and listings"],
            [<><Kbd>↑</Kbd> <Kbd>↓</Kbd> <Kbd>Enter</Kbd></>, "Move through results and open one", "Search box"],
            [<Kbd key="e">Esc</Kbd>, "Close a dialog or clear the search", "Everywhere"],
            [<Kbd key="f">F</Kbd>, "Switch focus mode on or off", "Official-site viewer"],
            [<><Kbd>Alt</Kbd> + <Kbd>←</Kbd> / <Kbd>→</Kbd></>, "Go back or forward", "Official-site viewer"],
          ]}
        />
      </DocSection>

      <DocSection id="footer" title="The footer">
        <p>
          At the bottom of every page you will find quick links, top exams, jobs by qualification and by state, the newsletter
          sign-up, contact details, and our policies (privacy, terms, disclaimer, editorial policy).
        </p>
        <Callout tone="note">
          Lost? The <Link href="/sitemap">Sitemap</Link> lists every section of the site on one page.
        </Callout>
      </DocSection>
    </>
  )
}
