"use client"

import { FAQ_ITEMS } from "@/lib/channels"

export function FaqAccordion({ openIndex, onToggle }: { openIndex: number | null; onToggle: (index: number | null) => void }) {
 return (
  <div className="border-t border-[var(--cp-border)]">
   {FAQ_ITEMS.map((item, index) => {
    const open = openIndex === index
    return (
     <div key={item.question} id={`faq-${index}`} className="scroll-mt-28 border-b border-[var(--cp-border)]">
      <h3>
       <button
        id={`faq-question-${index}`}
        type="button"
        onClick={() => onToggle(open ? null : index)}
        aria-expanded={open}
        aria-controls={`faq-panel-${index}`}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-[15px] font-medium text-[var(--cp-ink)] transition-colors hover:text-[var(--cp-link)]"
       >
        {item.question}
        <span aria-hidden className="w-4 shrink-0 text-center text-[18px] font-normal leading-none text-[var(--cp-muted)]">
         {open ? "−" : "+"}
        </span>
       </button>
      </h3>
      <div
       id={`faq-panel-${index}`}
       role="region"
       aria-labelledby={`faq-question-${index}`}
       aria-hidden={!open}
       data-open={open}
       className="cp-faq-answer"
      >
       <div className="cp-faq-inner">
        <p className="max-w-[68ch] pb-5 text-[15px] leading-relaxed text-[var(--cp-muted)]">
         {item.answer}
        </p>
       </div>
      </div>
     </div>
    )
   })}
  </div>
 )
}
