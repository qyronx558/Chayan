"use client"

import type { LucideIcon } from "lucide-react"
import { Bookmark, MessageSquare, ClipboardList, Briefcase, Upload, CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProfileStats } from "@/lib/profile"

interface StatsStripProps {
  admin: boolean
  stats: ProfileStats
}

interface Item {
  label: string
  value: number
  icon: LucideIcon
}

export function StatsStrip({ admin, stats }: StatsStripProps) {
  const items: Item[] = admin
    ? [
        { label: "Uploads", value: stats.uploads, icon: Upload },
        { label: "Approved", value: stats.approved, icon: CheckCircle2 },
        { label: "Pending review", value: stats.pendingReview, icon: Clock },
        { label: "Comments", value: stats.comments, icon: MessageSquare },
      ]
    : [
        { label: "Applications", value: stats.applications, icon: ClipboardList },
        { label: "Bookmarks", value: stats.bookmarks, icon: Bookmark },
        { label: "Saved jobs", value: stats.savedJobs, icon: Briefcase },
        { label: "Comments", value: stats.comments, icon: MessageSquare },
      ]
  return (
    <section
      aria-label={admin ? "Upload statistics" : "Account statistics"}
      className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 lg:grid-cols-4 dark:border-white/[0.06] dark:bg-white/[0.06]"
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            "flex min-w-0 items-center gap-3 bg-white p-4 dark:bg-[#0b1220]",
            i < items.length - 1 ? "" : ""
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-700/10 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300" aria-hidden="true">
            <item.icon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{item.value.toLocaleString("en-IN")}</span>
            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
          </span>
        </div>
      ))}
    </section>
  )
}
