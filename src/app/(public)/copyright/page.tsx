import Link from "next/link"
import type { Metadata } from "next"
import { Clause, LegalPaper } from "@/components/legal/LegalPaper"

export const metadata: Metadata = {
  title: "Copyright Policy",
  description: "Copyright Policy of ChayanJobs. Information about intellectual property rights and content usage.",
  openGraph: {
    title: "Copyright Policy - ChayanJobs",
    description: "Learn about copyright and content usage on ChayanJobs.",
  },
}

export default function CopyrightPage() {
  return (
    <LegalPaper kind="copyright" title="Copyright Policy" updated="Last updated: July 15, 2026">

      <Clause title="Our Copyright">
        <p>
          All original content published on ChayanJobs - including articles, compilations, layouts, graphics,
          logos, and design elements - is the intellectual property of ChayanJobs unless otherwise stated.
          This content is protected under applicable copyright laws.
        </p>
      </Clause>

      <Clause title="Publicly Available Information">
        <p>
          ChayanJobs aggregates and republishes publicly available information from official government sources,
          including job notifications, exam results, admit cards, and answer keys. Such content is in the
          public domain or is published in the public interest. We provide proper attribution and links to
          the original government sources wherever possible.
        </p>
      </Clause>

      <Clause title="Content Usage">
        <p>
          You may:
        </p>
        <ul>
          <li>View, read, and share our content for personal, non-commercial purposes</li>
          <li>Link to our pages from your website or social media</li>
          <li>Quote short excerpts with proper attribution and a link back to the original page</li>
        </ul>
        <p>
          You may NOT:
        </p>
        <ul className="legal-no">
          <li>Reproduce, republish, or distribute substantial portions of our content without prior written permission</li>
          <li>Use our content for commercial purposes without authorization</li>
          <li>Modify or create derivative works based on our original content</li>
          <li>Copy our design, layout, or branding elements</li>
        </ul>
      </Clause>

      <Clause title="Third-Party Content">
        <p>
          Our website may contain content from third parties, including images, articles, and embedded media.
          Such content remains the property of their respective owners. ChayanJobs does not claim ownership of
          third-party content and will remove it upon valid request from the copyright holder.
        </p>
      </Clause>

      <Clause title="Reporting Copyright Infringement">
        <p>
          If you believe that your copyrighted work has been used on ChayanJobs in a way that constitutes
          copyright infringement, please refer to our{" "}
          <Link href="/dmca">DMCA Policy</Link> for instructions
          on how to submit a takedown notice.
        </p>
      </Clause>

      <Clause title="Contact">
        <p>
          If you have any questions about our Copyright Policy or wish to request permission to use our
          content, please{" "}
          <Link href="/contact">contact us</Link>.
        </p>
      </Clause>
    </LegalPaper>
  )
}
