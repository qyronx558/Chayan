"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { CheckCircle2, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AttentionDatum } from "./types"
import { DataCard } from "./DataCard"

export type AttentionTone = "amber" | "red" | "teal" | "sky"

export interface AttentionRow extends AttentionDatum {
  icon: LucideIcon
  tone: AttentionTone
}

const TONE_ICON: Record<AttentionTone, string> = {
  amber: "bg-paper-2 text-brick dark:bg-paper-2 dark:text-brick",
  red: "bg-paper-2 text-brick dark:bg-paper-2 dark:text-brick",
  teal: "bg-paper-3 text-brick dark:bg-paper-3 dark:text-brick",
  sky: "bg-paper-3 text-brick dark:bg-paper-3 dark:text-brick",
}

export function AttentionList({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: AttentionRow[]
}) {
  const allClear = items.every((i) => i.count === 0)
  return (
    <DataCard title={title} subtitle={subtitle} className="h-full">
      {allClear ? (
        <div className="flex items-center gap-2 rounded-lg border border-rule px-3 py-3 text-sm text-muted-foreground  dark:text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-foreground" />
          Nothing needs attention right now.
        </div>
      ) : (
        <ul className="divide-y divide-rule100 ">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      TONE_ICON[item.tone]
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground dark:text-paper">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground dark:text-muted-foreground">
                      {item.sub}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-paper-3 px-2 py-0.5 text-xs font-bold tabular-nums text-foreground dark:bg-background/10 dark:text-muted-foreground">
                    {item.count.toLocaleString("en-IN")}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brick dark:text-muted-foreground" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </DataCard>
  )
}
