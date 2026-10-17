"use client"

import { useState } from "react"
import { DirectoryTable } from "@/components/contact/DirectoryTable"
import { FaqAccordion } from "@/components/contact/FaqAccordion"
import { HoursOffice } from "@/components/contact/HoursOffice"
import { MessageForm } from "@/components/contact/MessageForm"
import { OnThisPage } from "@/components/contact/OnThisPage"
import { PageHeader } from "@/components/contact/PageHeader"

export function ContactMain() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function handleSelectFaq(index: number) {
    setOpenIndex(index)
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    document
      .getElementById(`faq-${index}`)
      ?.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "center" })
  }

  return (
    <>
      <PageHeader onSelectFaq={handleSelectFaq} />
      <div className="grid gap-12 pb-16 md:pb-24 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-24">
        <OnThisPage />
        <div className="min-w-0">
          <section id="message" aria-labelledby="message-heading" className="scroll-mt-24">
            <h2 id="message-heading" className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--cp-ink)]">
              Send us a message
            </h2>
            <div className="mt-5">
              <MessageForm />
            </div>
          </section>

          <hr className="my-12 border-0 border-t border-[var(--cp-border)] md:my-16" />

          <section id="directory" aria-labelledby="directory-heading" className="scroll-mt-24">
            <h2 id="directory-heading" className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--cp-ink)]">
              Email directory
            </h2>
            <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-[var(--cp-muted)]">
              Every address below reaches its owner team directly. Using the right one gets you a faster reply.
            </p>
            <div className="mt-5">
              <DirectoryTable />
            </div>
          </section>

          <hr className="my-12 border-0 border-t border-[var(--cp-border)] md:my-16" />

          <section id="hours" aria-labelledby="hours-heading" className="scroll-mt-24">
            <h2 id="hours-heading" className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--cp-ink)]">
              Hours and office
            </h2>
            <div className="mt-5">
              <HoursOffice />
            </div>
          </section>

          <hr className="my-12 border-0 border-t border-[var(--cp-border)] md:my-16" />

          <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24">
            <h2 id="faq-heading" className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--cp-ink)]">
              Frequently asked
            </h2>
            <div className="mt-5">
              <FaqAccordion openIndex={openIndex} onToggle={setOpenIndex} />
            </div>
            <div className="mt-8 rounded-md border border-[var(--cp-border)] bg-[var(--cp-soft)] px-4 py-3.5">
              <p className="text-[14px] leading-relaxed text-[var(--cp-muted)]">
                ChayanJobs never asks for passwords, OTPs, or payments over email. If someone does, forward the
                message to{" "}
                <a
                  href="mailto:security@chayanjobs.com"
                  className="font-mono text-[var(--cp-link)] underline decoration-[var(--cp-link)]/40 underline-offset-4 hover:decoration-[var(--cp-link)]"
                >
                  security@chayanjobs.com
                </a>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
