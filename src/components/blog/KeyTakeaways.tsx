import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"

/* The three lines a reader would underline, copied onto a sticky note. */
export function KeyTakeaways({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <div className="relative my-9 -rotate-[0.5deg] px-6 pb-5 pt-6 text-[oklch(28%_0.03_60)] print:rotate-0 print:border print:border-black" style={{ background: "oklch(95% 0.07 95)", boxShadow: "0 1px 1px rgb(60 40 10 / .1), 0 18px 28px -20px rgb(60 40 10 / .55)" }}>
      <span className="absolute -top-2.5 left-8 h-6 w-20 rotate-[-4deg] bg-[oklch(92%_0.03_90/0.8)] shadow-[0_1px_2px_rgb(0_0_0/.12)] print:hidden" aria-hidden />
      <p className={cn(handFont.className, "text-[1.35rem] leading-tight")}>if you read nothing else:</p>
      <ol className="mt-3 space-y-3">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-3 text-[0.98rem] leading-relaxed">
            <span className={cn(handFont.className, "mt-[-2px] w-5 shrink-0 text-[1.25rem] leading-none text-[oklch(48%_0.18_28)]")}>{i + 1}.</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
