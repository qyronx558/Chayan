"use client"

import { useState } from "react"
import { DirectoryTable } from "@/components/contact/DirectoryTable"
import { FaqAccordion } from "@/components/contact/FaqAccordion"
import { HoursOffice } from "@/components/contact/HoursOffice"
import { MessageForm } from "@/components/contact/MessageForm"
import { OnThisPage } from "@/components/contact/OnThisPage"
import { PageHeader } from "@/components/contact/PageHeader"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"

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
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
       <h2 id="message-heading" className="font-display text-[28px] font-black leading-tight text-[var(--cp-ink)]">
        Send us a message
       </h2>
       <span className={cn(handFont.className, "text-[1.1rem] text-[var(--cp-muted)]")}>one letter, the right desk</span>
      </div>
      <div className="mt-5">
       <MessageForm />
      </div>
     </section>

     <hr className="my-12 border-0 border-t-2 border-dashed border-[var(--cp-border)] md:my-16" />

     <section id="directory" aria-labelledby="directory-heading" className="scroll-mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
       <h2 id="directory-heading" className="font-display text-[28px] font-black leading-tight text-[var(--cp-ink)]">
        Email directory
       </h2>
       <span className={cn(handFont.className, "text-[1.1rem] text-[var(--cp-muted)]")}>every team has its own pigeonhole</span>
      </div>
      <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-[var(--cp-muted)]">
       Every address below reaches its owner team directly. Using the right one gets you a faster reply.
      </p>
      <div className="mt-5">
       <DirectoryTable />
      </div>
     </section>

     <hr className="my-12 border-0 border-t-2 border-dashed border-[var(--cp-border)] md:my-16" />

     <section id="hours" aria-labelledby="hours-heading" className="scroll-mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
       <h2 id="hours-heading" className="font-display text-[28px] font-black leading-tight text-[var(--cp-ink)]">
        Hours and office
       </h2>
       <span className={cn(handFont.className, "text-[1.1rem] text-[var(--cp-muted)]")}>when we&apos;re in, and where</span>
      </div>
      <div className="mt-5">
       <HoursOffice />
      </div>
     </section>

     <hr className="my-12 border-0 border-t-2 border-dashed border-[var(--cp-border)] md:my-16" />

     <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
       <h2 id="faq-heading" className="font-display text-[28px] font-black leading-tight text-[var(--cp-ink)]">
        Frequently asked
       </h2>
       <span className={cn(handFont.className, "text-[1.1rem] text-[var(--cp-muted)]")}>asked at the counter, more than once</span>
      </div>
      <div className="mt-5">
       <FaqAccordion openIndex={openIndex} onToggle={setOpenIndex} />
      </div>
      <div className="relative mt-10 rotate-[-0.4deg] rounded-[3px] px-5 pb-4 pt-6 text-[oklch(28%_0.03_60)]" style={{ background: "oklch(93% 0.09 95)", boxShadow: "0 1px 1px rgb(60 40 10 / .1), 0 14px 22px -16px rgb(60 40 10 / .55)" }}>
       <span className="absolute -top-2.5 left-10 h-5 w-16 rotate-[-3deg] bg-[oklch(92%_0.03_90/0.85)] shadow-[0_1px_2px_rgb(0_0_0/.12)]" aria-hidden />
       <p className={cn(typeFont.className, "text-[10.5px] font-bold tracking-[0.25em] text-[oklch(45%_0.17_28)]")}>NOTICE · BEWARE OF FRAUD</p>
       <p className="mt-1.5 text-[14px] leading-relaxed">
        ChayanJobs never asks for passwords, OTPs, or payments over email. If someone does, forward the
        message to{" "}
        <a
         href="mailto:security@chayanjobs.com"
         className={cn(typeFont.className, "font-bold underline decoration-dotted underline-offset-4")}
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
