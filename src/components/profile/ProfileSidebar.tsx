"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SidebarItem {
  key: string
  label: string
  icon: LucideIcon
  dot?: boolean
  badge?: string
}

interface ProfileSidebarProps {
  items: SidebarItem[]
  active: string
  onSelect: (key: string) => void
}

export function ProfileSidebar({ items, active, onSelect }: ProfileSidebarProps) {
  return (
    <nav aria-label="Profile sections" className="hidden lg:block">
      <div className="sticky top-20 space-y-0.5">
        {items.map((item) => {
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule",
                isActive
                  ? "bg-paper-2 text-brick dark:bg-background/10 dark:text-brick"
                  : "text-muted-foreground hover:bg-paper-2/60 hover:text-foreground dark:text-muted-foreground dark:hover:bg-background/5 dark:hover:text-paper"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-brick" : "text-muted-foreground"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {item.dot ? (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brick" aria-label="Action needed" />
              ) : null}
              {item.badge ? (
                <span className="shrink-0 rounded-full bg-paper-3 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-brick dark:bg-paper-3 dark:text-brick">
                  {item.badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

interface ProfileMobileTabsProps {
  items: SidebarItem[]
  active: string
  onSelect: (key: string) => void
}

export function ProfileMobileTabs({ items, active, onSelect }: ProfileMobileTabsProps) {
  return (
    <nav aria-label="Profile sections" className="lg:hidden">
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-b border-rule pb-px">
        {items.map((item) => {
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              className={cn(
                "relative shrink-0 rounded-none border-b-2 bg-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule",
                isActive
                  ? "border-brick text-brick dark:text-brick"
                  : "border-transparent text-muted-foreground hover:text-foreground dark:text-muted-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="flex items-center gap-1.5">
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
                {item.dot ? <span className="h-1.5 w-1.5 rounded-full bg-brick" aria-label="Action needed" /> : null}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
