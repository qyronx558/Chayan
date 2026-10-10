"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TimelineItem {
  id: string
  title: string
  sub?: string
  meta?: string
  dot?: string
}

export function Timeline({
  items,
  emptyText,
  footer,
}: {
  items: TimelineItem[]
  emptyText: string
  footer?: { label: string; href: string }
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
  }
  return (
    <div>
      <ol className="relative space-y-3 border-l border-slate-200 pl-4 dark:border-white/10">
        {items.map((item) => (
          <li key={item.id} className="relative text-xs">
            <span
              className={cn(
                "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#0b1220]",
                item.dot ?? "bg-slate-300 dark:bg-slate-600"
              )}
            />
            <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
            {item.sub ? (
              <p className="mt-0.5 line-clamp-2 text-slate-500 dark:text-slate-400">{item.sub}</p>
            ) : null}
            {item.meta ? <p className="mt-0.5 text-slate-400 dark:text-slate-500">{item.meta}</p> : null}
          </li>
        ))}
      </ol>
      {footer ? (
        <Link
          href={footer.href}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
        >
          {footer.label} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  )
}
