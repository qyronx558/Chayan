import Link from "next/link"
import type { Metadata } from "next"
import { Clause, LegalPaper } from "@/components/legal/LegalPaper"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy of ChayanJobs. Learn about how we collect, use, and protect your personal information.",
  openGraph: {
    title: "Privacy Policy - ChayanJobs",
    description: "Understand how ChayanJobs handles your data and protects your privacy.",
  },
}

export default function PrivacyPage() {
  return (
    <LegalPaper kind="privacy" title="Privacy Policy" updated="Last updated: July 1, 2026">

      <Clause title="Information We Collect">
        <p>
          When you visit ChayanJobs, we may collect certain information automatically, including your
          IP address, browser type, operating system, referring URLs, and your interactions with our site.
          If you subscribe to our newsletter or contact us via email, we collect the personal information
          you provide, such as your name and email address.
        </p>
        <p>
          We do not collect sensitive personal data unless you voluntarily provide it. We never collect
          financial information such as bank account details, credit card numbers, or UPI identifiers.
        </p>
      </Clause>

      <Clause title="How We Use Your Information">
        <p>
          The information we collect is used to improve our services, personalize your experience, send
          job alerts and newsletters (only with your consent), and respond to your inquiries.
        </p>
        <p>
          We do not sell, trade, or rent your personal information to third parties. We may share
          aggregated, non-personally identifiable information for analytics and reporting purposes.
        </p>
      </Clause>

      <Clause title="Cookies">
        <p>
          ChayanJobs uses cookies and similar tracking technologies to enhance your browsing experience,
          analyze site traffic, and understand where our visitors come from. Cookies are small text files
          stored on your device by your web browser.
        </p>
        <p>
          You can control cookie preferences through your browser settings. Disabling cookies may affect
          certain features of our website. We use both session cookies (which expire when you close your
          browser) and persistent cookies (which remain until deleted).
        </p>
      </Clause>

      <Clause title="Third-Party Links">
        <p>
          Our website contains links to external third-party websites, including official government
          portals, examination bodies, and news sources. We are not responsible for the privacy practices
          or content of these external sites.
        </p>
        <p>
          We encourage you to review the privacy policies of any third-party sites you visit. The
          inclusion of a link does not imply endorsement by ChayanJobs.
        </p>
      </Clause>

      <Clause title="Data Security">
        <p>
          We implement reasonable technical and organizational measures to protect your personal
          information against unauthorized access, alteration, disclosure, or destruction.
        </p>
        <p>
          However, no method of transmission over the Internet or electronic storage is 100% secure.
          While we strive to protect your data, we cannot guarantee absolute security.
        </p>
      </Clause>

      <Clause title="Contact">
        <p>
          If you have any questions about this Privacy Policy, please{" "}
          <Link href="/contact">contact us</Link>.
        </p>
      </Clause>
    </LegalPaper>
  )
}
