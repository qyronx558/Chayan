import Link from "next/link"
import type { Metadata } from "next"
import { Clause, LegalPaper } from "@/components/legal/LegalPaper"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for ChayanJobs. Please read these terms carefully before using our website.",
  openGraph: {
    title: "Terms of Service - ChayanJobs",
    description: "Review the terms and conditions governing the use of ChayanJobs.",
  },
}

export default function TermsPage() {
  return (
    <LegalPaper kind="terms" title="Terms of Service" updated="Last updated: July 1, 2026">

      <Clause title="Acceptance of Terms">
        <p>
          By accessing or using ChayanJobs, you agree to be bound by these Terms of Service. If you do
          not agree with any part of these terms, please do not use our website. We reserve the right to
          update these terms at any time without prior notice.
        </p>
      </Clause>

      <Clause title="Use License">
        <p>
          Permission is granted to temporarily access and view the materials on ChayanJobs for
          personal, non-commercial use only. This is the grant of a license, not a transfer of title.
        </p>
        <p>
          Under this license you may not modify, copy, reproduce, republish, upload, post, transmit,
          or distribute any content from our website without prior written permission.
        </p>
      </Clause>

      <Clause title="Disclaimer">
        <p>
          The materials on ChayanJobs are provided on an &quot;as is&quot; basis. We make no warranties,
          expressed or implied, and hereby disclaim and negate all other warranties including, without
          limitation, implied warranties or conditions of merchantability, fitness for a particular
          purpose, or non-infringement of intellectual property.
        </p>
        <p>
          We do not warrant that the information on this website is accurate, complete, or current. We
          may change the content at any time without notice.
        </p>
      </Clause>

      <Clause title="Limitations">
        <p>
          In no event shall ChayanJobs or its suppliers be liable for any damages (including, without
          limitation, damages for loss of data or profit, or due to business interruption) arising out of
          the use or inability to use the materials on our website, even if we have been notified orally or
          in writing of the possibility of such damage.
        </p>
      </Clause>

      <Clause title="Accuracy of Information">
        <p>
          While we strive to keep all information accurate and up-to-date, we make no representations or
          warranties of any kind about the completeness, accuracy, reliability, suitability, or
          availability of the information on our website. Users are advised to verify all details on the
          respective official websites before applying for any position.
        </p>
      </Clause>

      <Clause title="Links to Other Websites">
        <p>
          Our website may contain links to third-party websites or services that are not owned or
          controlled by ChayanJobs. We have no control over, and assume no responsibility for, the
          content, privacy policies, or practices of any third-party websites.
        </p>
      </Clause>

      <Clause title="Modifications">
        <p>
          We reserve the right to revise these terms of service at any time without notice. By using this
          website, you agree to be bound by the current version of these terms of service.
        </p>
      </Clause>

      <Clause title="Contact">
        <p>
          If you have any questions about these terms, please{" "}
          <Link href="/contact">contact us</Link>.
        </p>
      </Clause>
    </LegalPaper>
  )
}
