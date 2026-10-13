"use client"

import { Clock3, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

export type HomeTab = "latest" | "trending"

/** Latest | Trending toggle used by every home content section. */
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
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-sm",
        className
      )}
    >
      <button
        role="tab"
        aria-selected={tab === "latest"}
        onClick={() => onChange("latest")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
          tab === "latest" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"
        )}
      >
        <Clock3 className="h-3.5 w-3.5" />
        Latest
      </button>
      <button
        role="tab"
        aria-selected={tab === "trending"}
        onClick={() => onChange("trending")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
          tab === "trending"
            ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm"
            : "text-gray-500 hover:text-gray-900"
        )}
      >
        <Flame className="h-3.5 w-3.5" />
        Trending
      </button>
    </div>
  )
}
