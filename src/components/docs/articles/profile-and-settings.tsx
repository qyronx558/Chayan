import Link from "next/link"
import { Callout, DocSection, DocSub, InfoTable, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "profile-and-settings",
  title: "Your profile and settings",
  description: "Fill in your details so alerts fit you, add a photo and resume, and make the site comfortable to read.",
  group: "account",
  minutes: 6,
  toc: [
    { id: "tabs", title: "The profile tabs" },
    { id: "details", title: "Your details" },
    { id: "photo", title: "Photo and banner" },
    { id: "strength", title: "Profile strength" },
    { id: "settings", title: "Settings" },
    { id: "saving", title: "How changes are saved" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="tabs" title="The profile tabs">
        <p>
          Open <Link href="/profile">Profile</Link> from the account menu at the top right. On a computer the tabs are on the left;
          on a phone they scroll across the top. A small red dot means a tab needs your attention (for example, two-step login
          is off).
        </p>
        <InfoTable
          head={["Tab", "What you do there"]}
          rows={[
            ["Profile", "Name, phone, date of birth, qualification, preferred states and job interests"],
            ["Resume", "Upload or replace your resume for private job matches"],
            ["Security", "Password, two-step login, active sessions and recent sign-ins"],
            ["Notifications", "Which alerts you get, and by email or SMS"],
            ["Settings", "Theme, text size, accessibility, time zone and site behaviour"],
            ["Data & Privacy", "Connected accounts, what we store, data download, account deletion"],
          ]}
        />
      </DocSection>

      <DocSection id="details" title="Your details">
        <p>These details decide which jobs we suggest and alert you about:</p>
        <ul>
          <li><strong>Date of birth</strong>: so we can show jobs within your age limit.</li>
          <li><strong>Qualification</strong>: your highest completed level.</li>
          <li><strong>Preferred states</strong>: where you want to work. Choose as many as you like.</li>
          <li><strong>Interested categories</strong>: for example banking, railway, defence, teaching.</li>
          <li><strong>Phone</strong>: needed if you want SMS alerts.</li>
        </ul>
      </DocSection>

      <DocSection id="photo" title="Photo and banner">
        <p>
          Tap the camera badge on your profile picture to upload a photo. The built-in editor lets you crop, rotate, flip, and
          adjust brightness, contrast and saturation before saving. Your photo appears in the header and next to your
          discussion posts.
        </p>
      </DocSection>

      <DocSection id="strength" title="Profile strength">
        <p>
          The strength meter shows how complete your profile is, and lists the next things to add. A complete profile gives
          you better job matches and more useful alerts. The page also shows your activity at a glance: applications tracked,
          bookmarks and comments.
        </p>
      </DocSection>

      <DocSection id="settings" title="Settings">
        <DocSub>Appearance</DocSub>
        <p>Choose light, dark or system theme, a text size from small to extra large, and <strong>compact mode</strong> for a denser layout.</p>
        <DocSub>Accessibility</DocSub>
        <p><strong>Reduce motion</strong> turns down animations. <strong>High contrast</strong> makes borders and text stronger.</p>
        <DocSub>Region and time</DocSub>
        <p>Your time zone, used for deadline reminders. India (IST) is the default.</p>
        <DocSub>Navigation and behaviour</DocSub>
        <ul>
          <li><strong>Default start page</strong>: open the site straight to Jobs, Admit Cards, My Applications or another page.</li>
          <li><strong>Open external links in new tab</strong>: skip the official-site viewer and use normal browser tabs.</li>
          <li><strong>Notification sounds</strong> and <strong>autoplay previews</strong> in search.</li>
        </ul>
        <DocSub>Communication</DocSub>
        <p>Turn promotional emails and the Monday weekly digest on or off, or <strong>mute all notifications</strong> for a while.</p>
        <DocSub>Reset settings</DocSub>
        <p>Puts every setting back to its default in one step.</p>
      </DocSection>

      <DocSection id="saving" title="How changes are saved">
        <p>
          Profile details are saved to your account when you tap save; a bar at the bottom reminds you if you have unsaved
          changes. Notification choices save as soon as you switch them. Some display settings are remembered by this browser,
          so you may need to set them again on a new device.
        </p>
        <Callout tone="tip">
          For your safety, account security lives in its own tab. See <Link href="/docs/security-and-privacy">Security and privacy</Link>.
        </Callout>
        <p>
          Can’t find a setting? Try <UiPath items={["Profile", "Settings"]} /> first, then{" "}
          <UiPath items={["Profile", "Notifications"]} />.
        </p>
      </DocSection>
    </>
  )
}
