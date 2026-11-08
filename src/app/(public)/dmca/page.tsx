import Link from "next/link"
import type { Metadata } from "next"

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
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-4xl font-bold text-foreground">DMCA Policy</h1>
      <p className="mb-8 text-sm text-muted-foreground">Last updated: July 15, 2026</p>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">Notice of Copyright Infringement</h2>
        <p className="leading-relaxed text-foreground">
          ChayanJobs respects the intellectual property rights of others. We comply with the Digital Millennium
          Copyright Act (DMCA) and other applicable copyright laws. If you believe that any content on our
          website infringes upon your copyright, please notify us with the following information:
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">Required Information</h2>
        <p className="mb-3 leading-relaxed text-foreground">
          To file a DMCA notice, please provide the following in writing:
        </p>
        <ol className="list-decimal space-y-2 pl-6 text-foreground">
          <li>A physical or electronic signature of the copyright owner or authorized representative</li>
          <li>Identification of the copyrighted work claimed to be infringed</li>
          <li>Identification of the infringing material and its location on our website (URL)</li>
          <li>Your contact information: name, address, telephone number, and email address</li>
          <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner</li>
          <li>A statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on their behalf</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">Submit a DMCA Notice</h2>
        <p className="leading-relaxed text-foreground">
          Please send your DMCA notice to:{" "}
          <Link href="/contact" className="text-brick hover:underline">Contact Us</Link>
          {" "}with the subject line &quot;DMCA Notice.&quot; We will respond to valid notices promptly.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">Counter-Notification</h2>
        <p className="mb-3 leading-relaxed text-foreground">
          If you believe that material you posted was removed in error, you may file a counter-notification
          with the following information:
        </p>
        <ol className="list-decimal space-y-2 pl-6 text-foreground">
          <li>Your physical or electronic signature</li>
          <li>Identification of the material removed and its location before removal</li>
          <li>A statement, under penalty of perjury, that you believe the material was removed in error</li>
          <li>Your name, address, telephone number, and email address</li>
          <li>A statement consenting to jurisdiction of the federal district court for your judicial district</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">Repeat Infringers</h2>
        <p className="leading-relaxed text-foreground">
          We reserve the right to terminate the accounts of users who are determined to be repeat copyright
          infringers. We also reserve the right to remove any content that we believe, in our sole discretion,
          may infringe upon the copyright of others.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-2xl font-semibold text-foreground">Contact</h2>
        <p className="leading-relaxed text-foreground">
          If you have any questions about our DMCA Policy, please{" "}
          <Link href="/contact" className="text-brick hover:underline">contact us</Link>.
        </p>
      </section>
    </div>
  )
}
