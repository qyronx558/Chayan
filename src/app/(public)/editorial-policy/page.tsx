import Link from "next/link"
import type { Metadata } from "next"
import { Clause, LegalPaper } from "@/components/legal/LegalPaper"

export const metadata: Metadata = {
  title: "Editorial Policy",
  description: "Editorial Policy of ChayanJobs. Learn about our content standards, fact-checking process, and correction policy.",
  openGraph: {
    title: "Editorial Policy - ChayanJobs",
    description: "Learn about ChayanJobs's content standards and editorial practices.",
  },
}

export default function EditorialPolicyPage() {
  return (
    <LegalPaper kind="editorial" title="Editorial Policy" updated="Last updated: July 15, 2026">

      <Clause title="Our Mission">
        <p>
          ChayanJobs is committed to providing accurate, timely, and reliable information about government job
          opportunities, examination results, admit cards, answer keys, and related announcements across India.
          Our editorial team works diligently to aggregate and present information from official government sources
          in a clear, accessible manner.
        </p>
      </Clause>

      <Clause title="Content Sources">
        <p>
          All content published on ChayanJobs is sourced from:
        </p>
        <ul>
          <li>Official government websites and portals (e.g., SSC, UPSC, State PSC, Railway Recruitment Boards, etc.)</li>
          <li>Official press releases and notifications published by government departments</li>
          <li>Verified announcements from authorized recruiting bodies</li>
          <li>Links to official sources are always provided for cross-verification</li>
        </ul>
      </Clause>

      <Clause title="Fact-Checking Standards">
        <p>
          We follow a rigorous fact-checking process:
        </p>
        <ul>
          <li>All information is cross-verified against official sources before publication</li>
          <li>Dates, deadlines, and eligibility criteria are verified with original notifications</li>
          <li>We clearly distinguish between factual information and editorial commentary</li>
          <li>Sponsored or promotional content, if any, will be clearly labeled as such</li>
        </ul>
      </Clause>

      <Clause title="Corrections Policy">
        <p>
          While we strive for accuracy, errors can occasionally occur. If you spot an error in our content:
        </p>
        <ul>
          <li>Please contact us immediately with the details of the error</li>
          <li>Our editorial team will review the reported error within 24 hours</li>
          <li>If the error is confirmed, we will correct it promptly and note the correction at the bottom of the page</li>
        </ul>
      </Clause>

      <Clause title="User-Generated Content">
        <p>
          Comments and user contributions, if enabled, are monitored for compliance with our community guidelines.
          We reserve the right to remove any content that is spam, offensive, misleading, or violates applicable
          laws. User comments represent the views of the individual and not necessarily those of ChayanJobs.
        </p>
      </Clause>

      <Clause title="Advertising Policy">
        <p>
          ChayanJobs displays advertisements through Google AdSense. Our editorial content is independent of
          advertising interests. We maintain a clear separation between editorial content and advertisements:
        </p>
        <ul>
          <li>Advertisements are clearly labeled and distinguishable from editorial content</li>
          <li>Advertisers have no influence over our editorial decisions or content</li>
          <li>We do not publish paid articles or sponsored content disguised as editorial content</li>
          <li>We comply with Google's ad placement policies and guidelines</li>
        </ul>
      </Clause>

      <Clause title="Contact">
        <p>
          If you have any questions about our Editorial Policy, please{" "}
          <Link href="/contact">contact us</Link>.
        </p>
      </Clause>
    </LegalPaper>
  )
}
