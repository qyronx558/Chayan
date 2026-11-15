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
    "inline-flex items-center gap-1 border border-rule",
    className
   )}
  >
   <button
    role="tab"
    aria-selected={tab === "latest"}
    onClick={() => onChange("latest")}
    className={cn(
     "inline-flex items-center gap-1.5 border-r border-rule px-3 py-1.5 text-xs font-medium transition-colors max-sm:min-h-10 max-sm:text-[13px]",
     tab === "latest" ? "bg-ink text-paper" : "text-muted-foreground hover:text-foreground"
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
     "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors max-sm:min-h-10 max-sm:text-[13px]",
     tab === "trending"
      ? "bg-ink text-paper"
      : "text-muted-foreground hover:text-foreground"
    )}
   >
    <Flame className="h-3.5 w-3.5" />
    Trending
   </button>
  </div>
 )
}
