import Link from "next/link"
import type { Metadata } from "next"

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
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-4xl font-bold text-foreground">Editorial Policy</h1>
      <p className="mb-8 text-sm text-muted-foreground">Last updated: July 15, 2026</p>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">Our Mission</h2>
        <p className="leading-relaxed text-foreground">
          ChayanJobs is committed to providing accurate, timely, and reliable information about government job
          opportunities, examination results, admit cards, answer keys, and related announcements across India.
          Our editorial team works diligently to aggregate and present information from official government sources
          in a clear, accessible manner.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">Content Sources</h2>
        <p className="mb-3 leading-relaxed text-foreground">
          All content published on ChayanJobs is sourced from:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-foreground">
          <li>Official government websites and portals (e.g., SSC, UPSC, State PSC, Railway Recruitment Boards, etc.)</li>
          <li>Official press releases and notifications published by government departments</li>
          <li>Verified announcements from authorized recruiting bodies</li>
          <li>Links to official sources are always provided for cross-verification</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">Fact-Checking Standards</h2>
        <p className="mb-3 leading-relaxed text-foreground">
          We follow a rigorous fact-checking process:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-foreground">
          <li>All information is cross-verified against official sources before publication</li>
          <li>Dates, deadlines, and eligibility criteria are verified with original notifications</li>
          <li>We clearly distinguish between factual information and editorial commentary</li>
          <li>Sponsored or promotional content, if any, will be clearly labeled as such</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">Corrections Policy</h2>
        <p className="mb-3 leading-relaxed text-foreground">
          While we strive for accuracy, errors can occasionally occur. If you spot an error in our content:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-foreground">
          <li>Please contact us immediately with the details of the error</li>
          <li>Our editorial team will review the reported error within 24 hours</li>
          <li>If the error is confirmed, we will correct it promptly and note the correction at the bottom of the page</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">User-Generated Content</h2>
        <p className="leading-relaxed text-foreground">
          Comments and user contributions, if enabled, are monitored for compliance with our community guidelines.
          We reserve the right to remove any content that is spam, offensive, misleading, or violates applicable
          laws. User comments represent the views of the individual and not necessarily those of ChayanJobs.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">Advertising Policy</h2>
        <p className="mb-3 leading-relaxed text-foreground">
          ChayanJobs displays advertisements through Google AdSense. Our editorial content is independent of
          advertising interests. We maintain a clear separation between editorial content and advertisements:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-foreground">
          <li>Advertisements are clearly labeled and distinguishable from editorial content</li>
          <li>Advertisers have no influence over our editorial decisions or content</li>
          <li>We do not publish paid articles or sponsored content disguised as editorial content</li>
          <li>We comply with Google's ad placement policies and guidelines</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">Contact</h2>
        <p className="leading-relaxed text-foreground">
          If you have any questions about our Editorial Policy, please{" "}
          <Link href="/contact" className="text-brick hover:underline">contact us</Link>.
        </p>
      </section>
    </div>
  )
}
