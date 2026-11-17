"use client"

import { Clock3, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

export type HomeTab = "latest" | "trending"

const TABS: { value: HomeTab; label: string; icon: typeof Clock3 }[] = [
  { value: "latest", label: "Latest", icon: Clock3 },
  { value: "trending", label: "Trending", icon: Flame },
]

/** Latest | Trending segmented control used by every home content section. */
export function SectionTabs({
  tab,
  onChange,
  className,
}: {
  tab: HomeTab
  onChange: (tab: HomeTab) => void
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label="Latest or trending"
      className={cn("hs-pill inline-flex items-center gap-0.5 border border-rule/50 bg-paper-2 p-1", className)}
    >
      {TABS.map(({ value, label, icon: Icon }) => {
        const active = tab === value
        return (
          <button
            key={value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(value)}
            className={cn(
              "hs-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all max-sm:min-h-9 max-sm:text-[13px]",
              active
                ? "bg-[var(--hs-surface)] text-foreground shadow-[0_1px_3px_rgba(0,0,0,.12)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", active && "text-[var(--hs-trust)]")} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
