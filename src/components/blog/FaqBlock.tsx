import type { FaqItem } from "@/lib/blog-prose"
import { MessageCircleQuestion } from "lucide-react"

export function FaqBlock({ items }: { items: FaqItem[] }) {
  if (!items.length) return null
  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/60" aria-label="Frequently asked questions">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <MessageCircleQuestion className="h-5 w-5 text-[#1B3A5C]" />
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">FAQs</h2>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {items.map((f, i) => (
          <details key={i} className="group px-5 py-4 open:bg-[#FAF6EE] dark:open:bg-blue-950/20">
            <summary className="cursor-pointer list-none text-[0.95rem] font-semibold text-gray-900 marker:hidden dark:text-gray-100 [&::-webkit-details-marker]:hidden">
              <span className="flex items-start justify-between gap-3">
                {f.q}
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-500 transition-transform group-open:rotate-45 group-open:bg-[#101E33] group-open:text-[#E8C87A] dark:bg-gray-700 dark:text-gray-300">+</span>
              </span>
            </summary>
            <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-300">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
