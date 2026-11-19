"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"

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

function NeedsYou() {
  return (
    <span className={cn(handFont.className, "shrink-0 text-[13px] text-[var(--color-brick)]")}>
      needs you
    </span>
  )
}

export function ProfileSidebar({ items, active, onSelect }: ProfileSidebarProps) {
  return (
    <nav aria-label="Profile sections" className="hidden lg:block">
      <div className="sticky top-20 -mr-px space-y-1.5">
        {items.map((item, i) => {
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex w-full items-center gap-2.5 rounded-l-[6px] border border-r-0 py-2.5 pl-3 pr-3 text-left text-sm transition-[transform,background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hs-trust)]",
                isActive
                  ? "translate-x-2 border-[var(--hs-kraft-edge)] bg-[var(--hs-paper-slip)] font-semibold text-foreground"
                  : "border-transparent bg-[var(--hs-kraft-tab)] text-foreground/70 hover:translate-x-1 hover:text-foreground"
              )}
              style={isActive ? { boxShadow: "-3px 2px 6px -3px rgb(60 40 10 / .3)" } : { marginLeft: `${(i % 2) * 6}px` }}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[var(--color-brick)]" : "text-foreground/50")} aria-hidden />
              <span className="flex-1 truncate">{item.label}</span>
              {item.dot ? <NeedsYou /> : null}
              {item.badge ? <span className="shrink-0 text-xs tabular-nums text-[var(--color-brick)]">{item.badge}</span> : null}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function ProfileMobileTabs({ items, active, onSelect }: ProfileSidebarProps) {
  return (
    <nav aria-label="Profile sections" className="lg:hidden">
      <div className="no-scrollbar -mx-4 flex items-end gap-1 overflow-x-auto border-b border-[var(--hs-kraft-edge)] px-4">
        {items.map((item) => {
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative -mb-px flex shrink-0 items-center gap-1.5 rounded-t-[6px] border border-b-0 px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hs-trust)]",
                isActive
                  ? "border-[var(--hs-kraft-edge)] bg-[var(--hs-paper-slip)] py-2.5 font-semibold text-foreground"
                  : "border-transparent bg-[var(--hs-kraft-tab)] py-2 text-foreground/70"
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
              {item.dot ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brick)]" aria-label="Needs attention" /> : null}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
