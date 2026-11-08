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
    return <p className="py-6 text-center text-sm text-muted-foreground dark:text-muted-foreground">{emptyText}</p>
  }
  return (
    <div>
      <ol className="relative space-y-3 border-l border-rule pl-4 ">
        {items.map((item) => (
          <li key={item.id} className="relative text-xs">
            <span
              className={cn(
                "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white ",
                item.dot ?? "bg-paper-3 dark:bg-ink-2"
              )}
            />
            <p className="truncate font-semibold text-foreground dark:text-paper">{item.title}</p>
            {item.sub ? (
              <p className="mt-0.5 line-clamp-2 text-muted-foreground dark:text-muted-foreground">{item.sub}</p>
            ) : null}
            {item.meta ? <p className="mt-0.5 text-muted-foreground dark:text-muted-foreground">{item.meta}</p> : null}
          </li>
        ))}
      </ol>
      {footer ? (
        <Link
          href={footer.href}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brick hover:underline dark:text-brick"
        >
          {footer.label} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  )
}
