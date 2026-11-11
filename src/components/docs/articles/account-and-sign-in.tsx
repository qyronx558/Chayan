import Link from "next/link"
import { Callout, DocSection, InfoTable, Step, Steps, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "account-and-sign-in",
  title: "Creating an account and signing in",
  description: "Register in under a minute, sign in with email or Google, use two-step login, and reset a forgotten password.",
  group: "account",
  minutes: 5,
  toc: [
    { id: "why", title: "Why have an account" },
    { id: "register", title: "Register" },
    { id: "sign-in", title: "Sign in" },
    { id: "two-step", title: "Signing in with two-step login" },
    { id: "forgot", title: "Forgot your password" },
    { id: "sign-out", title: "Signing out" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="why" title="Why have an account">
        <InfoTable
          head={["Without an account", "With a free account"]}
          rows={[
            ["Read every post", "Everything on the left, plus:"],
            ["Search and filter", "Bookmarks and the application tracker"],
            ["Use all free tools", "Alerts by email and SMS, and deadline reminders"],
            ["Read discussions", "Ask questions and reply in discussions"],
            ["", "Resume match scores for private jobs"],
          ]}
        />
      </DocSection>

      <DocSection id="register" title="Register">
        <Steps>
          <Step title="Tap Register at the top right" />
          <Step title="Choose a way to join">
            Tap <strong>Continue with Google</strong> for one-tap sign-up, or fill in your name, email and a password.
          </Step>
          <Step title="Pick a strong password">At least 8 characters. Mix words, numbers and symbols, and do not reuse a password from another site.</Step>
          <Step title="Finish your profile">
            Add your qualification, preferred states and interests in <UiPath items={["Profile"]} />, so alerts match you.
          </Step>
        </Steps>
      </DocSection>

      <DocSection id="sign-in" title="Sign in">
        <p>
          Go to <Link href="/login">Log in</Link>. Enter your email and password, or use Google if that is how you joined. Tick{" "}
          <strong>Remember me</strong> on your own device only.
        </p>
        <Callout tone="note" title="Joined with Google?">
          If you signed up with Google, keep using Google to sign in. You can see which sign-in methods are linked in{" "}
          <UiPath items={["Profile", "Data & Privacy", "Connected accounts"]} />.
        </Callout>
        <p>
          Too many wrong attempts in a short time will pause sign-in for a while. This protects your account from people
          guessing passwords. Wait a few minutes, then try again, or reset your password.
        </p>
      </DocSection>

      <DocSection id="two-step" title="Signing in with two-step login">
        <p>
          If you turned on two-step login (2FA), sign-in has one more screen after your password. Open your authenticator app
          (Google Authenticator, Microsoft Authenticator, Authy, or similar) and type the 6-digit code shown for ChayanJobs.
        </p>
        <ul>
          <li>Codes change every 30 seconds. If one is rejected, wait for the next code.</li>
          <li>
            Make sure your phone’s time is set automatically. A clock that is a few minutes off is the most common reason codes
            fail.
          </li>
        </ul>
        <Callout tone="important" title="Lost your phone?">
          Without your authenticator app you cannot finish signing in. <Link href="/contact">Contact us</Link> from the email
          address on your account and we will help you recover it after checking it is really you.
        </Callout>
        <p>How to turn it on: see <Link href="/docs/security-and-privacy">Security and privacy</Link>.</p>
      </DocSection>

      <DocSection id="forgot" title="Forgot your password">
        <Steps>
          <Step title="Open Forgot password">From the sign-in page, tap <Link href="/forgot-password">Forgot password</Link>.</Step>
          <Step title="Enter your email">We send a reset link if an account uses that address.</Step>
          <Step title="Open the link within one hour">For your safety the link stops working after one hour. Check your spam folder if you do not see it.</Step>
          <Step title="Choose a new password">
            After the change, devices that were signed in with the old password are signed out.
          </Step>
        </Steps>
      </DocSection>

      <DocSection id="sign-out" title="Signing out">
        <p>
          Tap your photo or initials at the top right, then <UiPath items={["Sign out"]} />. To sign out other devices too, use{" "}
          <UiPath items={["Profile", "Security", "Active sessions"]} />.
        </p>
      </DocSection>
    </>
  )
}
