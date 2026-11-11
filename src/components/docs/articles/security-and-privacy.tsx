import Link from "next/link"
import { Callout, DocSection, InfoTable, Step, Steps, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "security-and-privacy",
  title: "Security and privacy",
  description: "Protect your account with two-step login, see where you are signed in, download your data, or delete it.",
  group: "account",
  minutes: 7,
  toc: [
    { id: "basics", title: "Five habits that keep you safe" },
    { id: "two-step", title: "Turn on two-step login" },
    { id: "password", title: "Change your password" },
    { id: "sessions", title: "Where you are signed in" },
    { id: "your-data", title: "See and download your data" },
    { id: "delete", title: "Delete your account" },
    { id: "how-we-protect", title: "How we protect you" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="basics" title="Five habits that keep you safe">
        <ol>
          <li>Use a password you use nowhere else.</li>
          <li>Turn on two-step login.</li>
          <li>Never share a one-time code (OTP) with anyone, including people who say they are from ChayanJobs.</li>
          <li>Sign out on shared or cyber-café computers.</li>
          <li>Pay fees only on the recruiting body’s official website.</li>
        </ol>
      </DocSection>

      <DocSection id="two-step" title="Turn on two-step login">
        <p>
          Two-step login (also called 2FA) means a stolen password is not enough. Signing in needs your password <em>and</em> a
          6-digit code from an app on your phone.
        </p>
        <Steps>
          <Step title="Install an authenticator app">Google Authenticator, Microsoft Authenticator or Authy are all free.</Step>
          <Step title="Open Profile, then Security">
            Go to <UiPath items={["Profile", "Security", "Authenticator app (TOTP)"]} /> and start the setup.
          </Step>
          <Step title="Scan the QR code">In the app, tap add (+) and scan the code shown on screen.</Step>
          <Step title="Enter the 6-digit code">Type the code the app shows to confirm. You will see “Two-factor authentication enabled”.</Step>
        </Steps>
        <p>
          To turn it off, use <UiPath items={["Disable 2FA"]} /> and confirm with a current code. Staff accounts must keep it on.
        </p>
        <Callout tone="important">
          Keep your authenticator app on a phone you control. If you change phones, move your accounts to the new phone before
          wiping the old one.
        </Callout>
      </DocSection>

      <DocSection id="password" title="Change your password">
        <p>
          In <UiPath items={["Profile", "Security", "Change password"]} />, enter your current password and the new one twice. After
          the change you will be asked to sign in again, and every other device is signed out.
        </p>
      </DocSection>

      <DocSection id="sessions" title="Where you are signed in">
        <p>
          <strong>Active sessions</strong> lists the devices signed in to your account. Sign out any one you do not recognise,
          or sign out all others at once. <strong>Recent sign-ins</strong> shows successful and failed attempts, so you can spot
          someone trying to get in.
        </p>
        <Callout tone="warning" title="See a sign-in that was not you?">
          Change your password straight away, turn on two-step login, and <Link href="/contact">tell us</Link>.
        </Callout>
      </DocSection>

      <DocSection id="your-data" title="See and download your data">
        <p>
          <UiPath items={["Profile", "Data & Privacy"]} /> shows, in plain words, everything we keep about you:
        </p>
        <InfoTable
          head={["We store", "Why"]}
          rows={[
            ["Name, email, phone", "To sign you in and reach you"],
            ["Date of birth, qualification", "To check age limits and suggest jobs you qualify for"],
            ["Preferred states and categories", "To match alerts to you"],
            ["Resume and photo (if you add them)", "For match scores and your profile"],
            ["Applications, bookmarks, comments", "So your tracker, saved items and discussions work"],
          ]}
        />
        <p>
          Tap <UiPath items={["Export your data"]} /> to download a copy of everything as a file. You can also change your email
          choices and see which sign-in methods are connected here.
        </p>
      </DocSection>

      <DocSection id="delete" title="Delete your account">
        <p>
          In the <strong>Danger zone</strong>, choose <UiPath items={["Delete account"]} /> and type <strong>DELETE</strong> to
          confirm. This permanently removes your profile, preferences and activity. It cannot be undone, so export your data
          first if you want a copy.
        </p>
      </DocSection>

      <DocSection id="how-we-protect" title="How we protect you">
        <ul>
          <li><strong>Passwords are never stored as text.</strong> We keep only a scrambled form (a hash) that cannot be turned back into your password.</li>
          <li><strong>Guessing is slowed down.</strong> Too many wrong sign-ins pause further attempts for a while.</li>
          <li><strong>Old sessions end on password change.</strong> A changed or reset password signs out every older session.</li>
          <li><strong>Official sites stay separate.</strong> Pages shown in the viewer cannot act as you on ChayanJobs.</li>
          <li><strong>Staff actions are recorded.</strong> Every change our team makes is written to a tamper-evident log.</li>
        </ul>
        <p>
          Full details are in our <Link href="/privacy">Privacy Policy</Link> and <Link href="/cookie-policy">Cookie Policy</Link>.
        </p>
      </DocSection>
    </>
  )
}
