"use client"

import Link from "next/link"
import { ClipboardList, Bookmark, Briefcase, Bell, MessageSquare, FileSearch } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickActionsProps {
  admin: boolean
  counts: { applications: number; bookmarks: number; savedJobs: number; comments: number }
}

const MEMBER_ACTIONS = [
  { href: "/applications", label: "Applications", icon: ClipboardList, countKey: "applications" as const },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark, countKey: "bookmarks" as const },
  { href: "/jobs", label: "Browse Jobs", icon: Briefcase, countKey: "savedJobs" as const },
  { href: "/notifications", label: "Notifications", icon: Bell, countKey: null },
]

const ADMIN_ACTIONS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: FileSearch, countKey: null },
  { href: "/notifications", label: "Notifications", icon: Bell, countKey: null },
  { href: "/admin/review", label: "Review Queue", icon: MessageSquare, countKey: null },
]

export function QuickActions({ admin, counts }: QuickActionsProps) {
  const actions = admin ? ADMIN_ACTIONS : MEMBER_ACTIONS

  return (
    <section aria-label="Quick actions" className="flex flex-wrap gap-2">
      {actions.map((a) => {
        const count = a.countKey ? counts[a.countKey] : null
        return (
          <Link
            key={a.href}
            href={a.href}
            className={cn(
              "group flex items-center gap-2 rounded-lg border border-rule bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-all",
              "hover:border-brick/30 hover:bg-paper-2 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule",
              "dark:hover:bg-background/10 dark:hover:text-paper"
            )}
          >
            <a.icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-brick" />
            <span>{a.label}</span>
            {count !== null && count > 0 ? (
              <span className="ml-0.5 rounded-full bg-paper-3 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-brick dark:bg-paper-3 dark:text-brick">
                {count}
              </span>
            ) : null}
          </Link>
        )
      })}
    </section>
  )
}
