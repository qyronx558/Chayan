import Link from "next/link"
import type { Metadata } from "next"
import { Clause, LegalPaper } from "@/components/legal/LegalPaper"

export const metadata: Metadata = {
  title: "DMCA Policy",
  description: "DMCA notice and takedown policy for ChayanJobs. Learn how to report copyright infringement.",
  openGraph: {
    title: "DMCA Policy - ChayanJobs",
    description: "Learn how to report copyright infringement on ChayanJobs.",
  },
}

export default function DMCAPage() {
  return (
    <LegalPaper kind="dmca" title="DMCA Policy" updated="Last updated: July 15, 2026">

      <Clause title="Notice of Copyright Infringement">
        <p>
          ChayanJobs respects the intellectual property rights of others. We comply with the Digital Millennium
          Copyright Act (DMCA) and other applicable copyright laws. If you believe that any content on our
          website infringes upon your copyright, please notify us with the following information:
        </p>
      </Clause>

      <Clause title="Required Information">
        <p>
          To file a DMCA notice, please provide the following in writing:
        </p>
        <ol>
          <li>A physical or electronic signature of the copyright owner or authorized representative</li>
          <li>Identification of the copyrighted work claimed to be infringed</li>
          <li>Identification of the infringing material and its location on our website (URL)</li>
          <li>Your contact information: name, address, telephone number, and email address</li>
          <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner</li>
          <li>A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on their behalf</li>
        </ol>
      </Clause>

      <Clause title="Submit a DMCA Notice">
        <p>
          Please send your DMCA notice to:{" "}
          <Link href="/contact">Contact Us</Link>
          {" "}with the subject line &quot;DMCA Notice.&quot; We will respond to valid notices promptly.
        </p>
      </Clause>

      <Clause title="Counter-Notification">
        <p>
          If you believe that material you posted was removed in error, you may file a counter-notification
          with the following information:
        </p>
        <ol>
          <li>Your physical or electronic signature</li>
          <li>Identification of the material removed and its location before removal</li>
          <li>A statement, under penalty of perjury, that you believe the material was removed in error</li>
          <li>Your name, address, telephone number, and email address</li>
          <li>A statement consenting to jurisdiction of the federal district court for your judicial district</li>
        </ol>
      </Clause>

      <Clause title="Repeat Infringers">
        <p>
          We reserve the right to terminate the accounts of users who are determined to be repeat copyright
          infringers. We also reserve the right to remove any content that we believe, in our sole discretion,
          may infringe upon the copyright of others.
        </p>
      </Clause>

      <Clause title="Contact">
        <p>
          If you have any questions about our DMCA Policy, please{" "}
          <Link href="/contact">contact us</Link>.
        </p>
      </Clause>
    </LegalPaper>
  )
}
