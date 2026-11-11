import Link from "next/link"
import { Callout, DocSection, InfoTable, Step, Steps, UiPath } from "../DocPrimitives"
import type { DocMeta } from "../types"

export const meta: DocMeta = {
  slug: "employer-studio",
  title: "Employer Studio",
  description: "Verify your company, post jobs for free, follow your results, and earn coins for real hiring milestones.",
  group: "employers",
  minutes: 7,
  toc: [
    { id: "what", title: "What it is" },
    { id: "verify", title: "Verify your company" },
    { id: "post", title: "Post a job" },
    { id: "analytics", title: "Analytics" },
    { id: "coins", title: "Coins pilot" },
    { id: "referrals", title: "Referrals" },
    { id: "withdraw", title: "Withdrawing coins" },
    { id: "rules", title: "Fair-play rules" },
  ],
}

export default function Body() {
  return (
    <>
      <DocSection id="what" title="What it is">
        <p>
          The <Link href="/employer">Employer Studio</Link> is the company side of ChayanJobs. Verified companies post jobs for free,
          see how they perform, and, during the pilot, earn coins when real hiring happens. Open it from{" "}
          <UiPath items={["Jobs", "For Employers"]} /> in the header.
        </p>
        <p>You sign in with a normal ChayanJobs account, the same kind job seekers use.</p>
      </DocSection>

      <DocSection id="verify" title="Verify your company">
        <Steps>
          <Step title="Sign in and open the Employer Studio" />
          <Step title="Enter your company">Your company name and its web domain (for example, acme.com). If the company is already listed, claim it.</Step>
          <Step title="Confirm your work email">We send a 6-digit code to an address at that domain. Enter it to prove you work there.</Step>
          <Step title="You are verified">Your jobs now carry the <strong>Verified</strong> badge, which job seekers trust more.</Step>
        </Steps>
        <Callout tone="note">Free email addresses (like Gmail) cannot verify a company. Use your work inbox.</Callout>
      </DocSection>

      <DocSection id="post" title="Post a job">
        <p>
          From <UiPath items={["Jobs"]} /> in the studio, create a job with the title, description, location, work mode, salary
          range and apply link. Posting is free, and jobs from a verified company go live straight away. Each job gets a trust
          score from its apply link, your company website and scam checks, so a clear description and an apply link on your own
          domain help job seekers trust it.
        </p>
      </DocSection>

      <DocSection id="analytics" title="Analytics">
        <p>
          The dashboard shows your top jobs, views over the last 30 days, tracked applies and bookmarks. Open{" "}
          <UiPath items={["Analytics"]} /> for job-by-job detail. Views are for your information only; they do not earn coins.
        </p>
      </DocSection>

      <DocSection id="coins" title="Coins pilot">
        <p>
          During the pilot, companies earn coins for milestones that show real hiring. <strong>1,000 coins = ₹20.</strong> The
          pilot is open to the first 100 companies, with one rewarded job per company.
        </p>
        <InfoTable
          head={["Milestone", "Coins"]}
          rows={[
            ["A real, unique job stays live for 7 days", "100"],
            ["The job gets 3 unique, completed applications", "900"],
            ["You confirm an interview took place", "500"],
            ["You confirm a hire", "500"],
            ["A company you invited reaches 3 applications", "1,000"],
          ]}
        />
        <p>New coins start as <strong>pending</strong> and become <strong>withdrawable</strong> after our team reviews them.</p>
      </DocSection>

      <DocSection id="referrals" title="Referrals">
        <p>
          In <UiPath items={["Referrals"]} />, copy your referral link and share it with HR friends at other companies. When a
          company that joined through your link gets 3 applications on its job, you earn 1,000 coins. The page lists your
          recent invites and their status.
        </p>
      </DocSection>

      <DocSection id="withdraw" title="Withdrawing coins">
        <Steps>
          <Step title="Save your UPI ID">In <UiPath items={["Coins & cash"]} />, add the UPI ID where you want to be paid.</Step>
          <Step title="Request a withdrawal">Withdrawals unlock at 1,000 withdrawable coins (₹20). Enter the coins to withdraw.</Step>
          <Step title="Admin approval">Our team approves the request and sends the payment. Your withdrawal history shows each request and its status.</Step>
        </Steps>
      </DocSection>

      <DocSection id="rules" title="Fair-play rules">
        <ul>
          <li>Only real, unique jobs count. Duplicate or fake jobs earn nothing and may be removed.</li>
          <li>Applications must come from different, real people.</li>
          <li>Interviews and hires are counted only when you confirm them.</li>
          <li>Never charge applicants any fee. Jobs that do are removed.</li>
        </ul>
        <Callout tone="tip">
          Questions about the pilot? Write to us through the <Link href="/contact">contact page</Link> and choose the employer topic if offered.
        </Callout>
      </DocSection>
    </>
  )
}
