import type { FaqItem } from "@/lib/blog-prose"
import { MessageCircleQuestion } from "lucide-react"
import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"

export function FaqBlock({ items }: { items: FaqItem[] }) {
  if (!items.length) return null
  return (
    <section className="mt-12" aria-label="Frequently asked questions">
      <h2 className="flex items-center gap-2 font-display text-[1.4rem] font-black text-foreground">
        <MessageCircleQuestion className="h-5 w-5 text-[var(--color-brick)]" /> Doubts readers asked
      </h2>
      <div className="mt-3">
        {items.map((f, i) => (
          <details key={i} className="group border-b border-dashed border-[var(--hs-border-strong,var(--color-rule))] py-4">
            <summary className="cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="flex items-start gap-3">
                <span className={cn(handFont.className, "w-6 shrink-0 text-[1.25rem] leading-tight text-[var(--color-brick)]")}>Q.</span>
                <span className="flex-1 text-[1rem] font-semibold leading-snug text-foreground">{f.q}</span>
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--hs-border-strong,var(--color-rule))] text-sm text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-2 flex gap-3 text-[14.5px] leading-7 text-muted-foreground">
              <span className={cn(handFont.className, "w-6 shrink-0 text-[1.25rem] leading-snug text-[var(--hs-trust,var(--color-ink))]")}>A.</span>
              <span>{f.a}</span>
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
