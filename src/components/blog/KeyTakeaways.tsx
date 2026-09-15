import { Sparkles, Check } from "lucide-react"

export function KeyTakeaways({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <div className="my-8 overflow-hidden rounded-2xl border border-[#E5DCC8] bg-[#FAF6EE] dark:border-gray-700 dark:bg-gray-800/60">
      <div className="flex items-center gap-2 border-b border-[#E5DCC8] px-5 py-3 dark:border-gray-700">
        <Sparkles className="h-4 w-4 text-[#8A6D3B]" />
        <p className="text-sm font-bold uppercase tracking-wide text-[#5C4A26] dark:text-amber-200">Key takeaways</p>
      </div>
      <ul className="space-y-3 px-5 py-4">
        {items.map((t, i) => (
          <li key={i} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-gray-800 dark:text-gray-200">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#101E33] text-[#E8C87A]">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
