import type { FaqItem } from "@/lib/blog-prose"
import { MessageCircleQuestion } from "lucide-react"

export function FaqBlock({ items }: { items: FaqItem[] }) {
  if (!items.length) return null
  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-rule bg-background dark:border-ink dark:bg-ink/60" aria-label="Frequently asked questions">
      <div className="flex items-center gap-2 border-b border-rule px-5 py-4 dark:border-ink">
        <MessageCircleQuestion className="h-5 w-5 text-brick" />
        <h2 className="text-base font-bold text-foreground dark:text-paper">FAQs</h2>
      </div>
      <div className="divide-y divide-rule100 dark:divide-rule700">
        {items.map((f, i) => (
          <details key={i} className="group px-5 py-4 open:bg-paper-2 dark:open:bg-paper-3">
            <summary className="cursor-pointer list-none text-[0.95rem] font-semibold text-foreground marker:hidden dark:text-paper [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-3">
                {f.q}
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper-3 text-sm text-muted-foreground transition-colors group-open:rotate-45 group-open:bg-ink group-open:text-paper dark:bg-ink dark:text-muted-foreground">+</span>
              </span>
            </summary>
            <p className="mt-2 text-sm leading-7 text-muted-foreground dark:text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
