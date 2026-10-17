import type { Metadata } from "next"
import "./contact.css"
import { ContactFooter } from "@/components/contact/ContactFooter"
import { ContactHeader } from "@/components/contact/ContactHeader"
import { ContactMain } from "@/components/contact/ContactMain"

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Contact the ChayanJobs team. Send a message, browse official email channels, support hours, and answers to frequently asked questions.",
  alternates: { canonical: "/contact" },
}

export default function ContactPage() {
  return (
    <div className="contact-scope min-h-screen text-[15px] antialiased">
      <ContactHeader />
      <main className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <ContactMain />
      </main>
      <ContactFooter />
    </div>
  )
}
