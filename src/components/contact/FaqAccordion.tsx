"use client"

import { FAQ_ITEMS } from "@/lib/channels"
import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"

export function FaqAccordion({ openIndex, onToggle }: { openIndex: number | null; onToggle: (index: number | null) => void }) {
 return (
  <div className="space-y-3">
   {FAQ_ITEMS.map((item, index) => {
    const open = openIndex === index
    return (
     <div
      key={item.question}
      id={`faq-${index}`}
      className={cn("scroll-mt-28 rounded-[4px] border border-[var(--cp-border)] bg-[var(--hs-paper-slip)] px-5 transition-shadow", open ? "shadow-[0_16px_26px_-18px_rgb(40_20_0/.55)]" : "shadow-[0_4px_8px_-6px_rgb(40_20_0/.35)]")}
     >
      <h3>
       <button
        id={`faq-question-${index}`}
        type="button"
        onClick={() => onToggle(open ? null : index)}
        aria-expanded={open}
        aria-controls={`faq-panel-${index}`}
        className="flex w-full items-baseline gap-3 py-4 text-left text-[15px] font-semibold text-[var(--cp-ink)] transition-colors hover:text-[var(--color-brick)]"
       >
        <span aria-hidden className={cn(handFont.className, "shrink-0 text-[1.2rem] font-normal text-[var(--color-brick)]")}>Q.</span>
        <span className="flex-1">{item.question}</span>
        <span aria-hidden className={cn("shrink-0 self-center text-[20px] font-normal leading-none text-[var(--cp-muted)] transition-transform duration-200", open && "rotate-45")}>
         +
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
        <p className="flex max-w-[70ch] gap-3 border-t border-dashed border-[var(--cp-border)] pb-5 pt-3 text-[15px] leading-relaxed text-[var(--cp-muted)]">
         <span aria-hidden className={cn(handFont.className, "shrink-0 text-[1.2rem] text-[oklch(45%_0.1_160)]")}>A.</span>
         <span>{item.answer}</span>
        </p>
       </div>
      </div>
     </div>
    )
   })}
  </div>
 )
}
