import Link from "next/link"
import { Callout, DocSection, InfoTable, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "alerts-and-newsletter",
  title: "Notifications, alerts and the newsletter",
  description: "Choose exactly which updates reach you, how often, and when to keep quiet.",
  group: "account",
  minutes: 5,
  toc: [
    { id: "kinds", title: "Three ways we keep you updated" },
    { id: "bell", title: "The bell" },
    { id: "alerts", title: "Choosing your alerts" },
    { id: "delivery", title: "How often, and quiet hours" },
    { id: "newsletter", title: "The newsletter" },
    { id: "stop", title: "Turning things off" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="kinds" title="Three ways we keep you updated">
        <InfoTable
          head={["Way", "What it is", "Needs an account"]}
          rows={[
            ["Notifications page", "Public announcements: new posts, date changes, important notices", "No"],
            ["The bell", "Your personal notifications, live on the site", "Yes"],
            ["Email and SMS alerts", "Updates that reach you when you are not on the site", "Yes"],
          ]}
        />
        <p>
          The <Link href="/notifications">Notifications page</Link> is open to everyone. Each notice has a button to the official
          link and, when we have a full post about it, <strong>View details</strong>.
        </p>
      </DocSection>

      <DocSection id="bell" title="The bell">
        <p>
          When you are signed in, the bell in the header shows a count of unread notifications. New ones appear the moment they
          are published, with no need to refresh. Tap a notification to open it.
        </p>
      </DocSection>

      <DocSection id="alerts" title="Choosing your alerts">
        <p>
          Go to <UiPath items={["Profile", "Notifications"]} />. Each row is a kind of update; switch on the channels you want. Your
          choices save on their own.
        </p>
        <InfoTable
          head={["Alert", "You hear about"]}
          rows={[
            ["New jobs matching my preferences", "Jobs in your preferred states and categories"],
            ["Results", "Result declarations"],
            ["Admit cards", "Hall ticket releases"],
            ["Answer keys", "Answer key releases"],
            ["Deadline reminders", "Last dates of tracked jobs, 3 days before"],
            ["Security alerts", "Password changes, two-step login and new sign-ins"],
          ]}
        />
        <Callout tone="tip" title="Better alerts start with your profile">
          Job alerts follow your preferred states and categories. Set them in <UiPath items={["Profile"]} /> or you may get too many
          or too few. SMS alerts need a phone number on your profile.
        </Callout>
      </DocSection>

      <DocSection id="delivery" title="How often, and quiet hours">
        <InfoTable
          head={["Email digest", "What you get"]}
          rows={[
            ["Instant", "An email as each update happens"],
            ["Daily at 8:00", "One email each morning with everything new"],
            ["Weekly", "One summary email a week"],
          ]}
        />
        <p>
          Turn on <strong>Quiet hours</strong> to stop SMS and push messages from 22:00 to 07:00. Email keeps arriving, quietly,
          in your inbox.
        </p>
      </DocSection>

      <DocSection id="newsletter" title="The newsletter">
        <p>
          You do not need an account for the newsletter. Enter your email in the box in the footer of any page. You get a regular
          digest of new jobs, results and deadlines. Signed-in users can also switch on the <strong>Monday weekly digest</strong>{" "}
          in <UiPath items={["Profile", "Settings", "Communication"]} />.
        </p>
      </DocSection>

      <DocSection id="stop" title="Turning things off">
        <ul>
          <li>Switch off single alerts in <UiPath items={["Profile", "Notifications"]} />.</li>
          <li>Pause everything at once with <UiPath items={["Profile", "Settings", "Mute all notifications"]} />.</li>
          <li>Every newsletter email has an unsubscribe link at the bottom.</li>
        </ul>
      </DocSection>
    </>
  )
}
