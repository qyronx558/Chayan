import { Sparkles, Check } from "lucide-react"

export function KeyTakeaways({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-rule bg-paper-2 dark:border-ink dark:bg-ink/60">
      <div className="flex items-center gap-2 border-b border-rule px-5 py-3 dark:border-ink">
        <Sparkles className="h-4 w-4 text-brick" />
        <p className="text-sm font-bold  text-brick dark:text-brick">Key takeaways</p>
      </div>
      <ul className="space-y-3 px-5 py-4">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-foreground dark:text-muted-foreground">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-paper">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
