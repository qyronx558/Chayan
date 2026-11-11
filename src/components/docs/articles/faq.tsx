import Link from "next/link"
import { DocSection, Faq, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "faq",
  title: "FAQ and troubleshooting",
  description: "Quick answers to the questions we hear most, and fixes for common problems.",
  group: "help",
  minutes: 6,
  toc: [
    { id: "general", title: "General" },
    { id: "account", title: "Account and sign-in" },
    { id: "alerts", title: "Alerts" },
    { id: "pages", title: "Pages and the viewer" },
    { id: "contact", title: "Still need help?" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="general" title="General">
        <Faq q="Is ChayanJobs a government website?">
          <p>
            No. ChayanJobs is an independent platform that collects and explains official announcements. We always link to the
            official website, which is where you apply and pay.
          </p>
        </Faq>
        <Faq q="Can I apply for a job on ChayanJobs?">
          <p>
            You apply on the recruiting body’s official website. ChayanJobs opens it for you in the{" "}
            <Link href="/docs/official-site-viewer">official-site viewer</Link>, with the job details beside the form.
          </p>
        </Faq>
        <Faq q="Is it really free?">
          <p>Yes. Reading, searching, alerts, the tracker and all tools are free. We never charge for selection.</p>
        </Faq>
        <Faq q="The date on ChayanJobs is different from the official notice. Which is right?">
          <p>
            The official notice. Dates sometimes change after we publish. Please <Link href="/contact">tell us</Link> so we can update the page.
          </p>
        </Faq>
        <Faq q="Why can’t I find a job I heard about?">
          <p>
            It may not be officially announced yet, or it may use a different name. Try a shorter search, check the{" "}
            <Link href="/exam-calendar">Exam Calendar</Link>, or see <Link href="/docs/search">Search tips</Link>.
          </p>
        </Faq>
      </DocSection>

      <DocSection id="account" title="Account and sign-in">
        <Faq q="I didn’t get the password reset email.">
          <ul>
            <li>Check spam, promotions and updates folders.</li>
            <li>Make sure you typed the email you registered with.</li>
            <li>If you joined with Google, sign in with Google instead; you may not have a password.</li>
            <li>The link works for one hour. Request a new one if it has expired.</li>
          </ul>
        </Faq>
        <Faq q="My two-step login code is not accepted.">
          <ul>
            <li>Type the newest code; each one lasts only 30 seconds.</li>
            <li>Set your phone’s date and time to automatic. A wrong clock is the most common cause.</li>
            <li>Make sure you are using the ChayanJobs entry in your authenticator app.</li>
            <li>Lost your phone? <Link href="/contact">Contact us</Link> from your account email.</li>
          </ul>
        </Faq>
        <Faq q="It says I tried too many times.">
          <p>Sign-in is paused for a short while after many failed attempts. Wait a few minutes, then try again or reset your password.</p>
        </Faq>
        <Faq q="How do I change my email address?">
          <p>
            Write to us through the <Link href="/contact">contact page</Link> from your current email address and we will help.
          </p>
        </Faq>
      </DocSection>

      <DocSection id="alerts" title="Alerts">
        <Faq q="I’m getting too many emails.">
          <p>
            Switch the email digest to <em>Daily</em> or <em>Weekly</em> in <UiPath items={["Profile", "Notifications"]} />, and narrow
            your preferred states and categories in <UiPath items={["Profile"]} />.
          </p>
        </Faq>
        <Faq q="I’m not getting any alerts.">
          <ul>
            <li>Check the alerts are switched on in <UiPath items={["Profile", "Notifications"]} />.</li>
            <li>Make sure <em>Mute all notifications</em> is off in <UiPath items={["Profile", "Settings"]} />.</li>
            <li>For SMS, add your phone number to your profile. Quiet hours hold SMS between 22:00 and 07:00.</li>
            <li>Add our email address to your contacts so alerts don’t land in spam.</li>
          </ul>
        </Faq>
      </DocSection>

      <DocSection id="pages" title="Pages and the viewer">
        <Faq q="The official website is blank inside ChayanJobs.">
          <p>
            Some sites refuse to be shown inside other websites, and some are simply down. Choose <em>Continue on official site</em>{" "}
            to open it in a normal tab, or <em>Try direct again</em> after a moment.
          </p>
        </Faq>
        <Faq q="A PDF won’t download.">
          <p>Use the direct download link the viewer offers. If the official server is busy (common on result days), try again in a few minutes.</p>
        </Faq>
        <Faq q="The site looks wrong or old.">
          <p>Refresh the page. If it still looks wrong, clear your browser cache, or try another browser, and tell us your device and browser.</p>
        </Faq>
        <Faq q="The text is too small.">
          <p>Increase it in <UiPath items={["Profile", "Settings", "Appearance"]} />, or use your browser’s zoom (Ctrl and +).</p>
        </Faq>
      </DocSection>

      <DocSection id="contact" title="Still need help?">
        <p>
          Write to us through the <Link href="/contact">contact page</Link>. Include the page address, what you expected, and what
          happened instead. A screenshot helps a lot.
        </p>
      </DocSection>
    </>
  )
}
