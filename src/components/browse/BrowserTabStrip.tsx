"use client"

import { FileText, Plus, X } from "lucide-react"
import type { BrowserTab } from "@/components/browse/useBrowserTabs"
import { cn } from "@/lib/utils"

interface BrowserTabStripProps {
 tabs: BrowserTab[]
 activeId: string | null
 onSwitch: (id: string) => void
 onClose: (id: string) => void
 onNew: () => void
}

/**
 * Chrome-like tab strip, visible on every screen size.
 * Scrollable titles (never just a counter), active tab raised,
 * close always tappable on the active tab and on touch screens.
 */
export function BrowserTabStrip({ tabs, activeId, onSwitch, onClose, onNew }: BrowserTabStripProps) {
 return (
  <div className="flex h-10 w-full shrink-0 items-end gap-1 overflow-hidden bg-paper-3 px-2 pt-1 dark:bg-ink dark:border-b dark:border-ink">
   <div
    className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto pb-0.5 [scrollbar-width:thin]"
    role="tablist"
    aria-label="Browser tabs"
   >
    {tabs.map((t) => {
     const isActive = t.id === activeId
     const isBlank = t.url === ""
     return (
      <div
       key={t.id}
       role="tab"
       aria-selected={isActive}
       onClick={() => onSwitch(t.id)}
       title={isBlank ? "New tab" : `${t.title}\n${t.url}`}
       className={cn(
        "group flex h-8 w-40 min-w-0 max-w-[160px] shrink-0 cursor-pointer items-center gap-1.5 rounded-t-lg border-x border-t px-2 text-xs transition-colors sm:max-w-[200px]",
        isActive
         ? "border-rule bg-background font-semibold text-foreground dark:border-ink dark:bg-paper dark:text-paper"
         : "border-transparent text-muted-foreground hover:bg-paper-3/70 hover:text-foreground dark:text-muted-foreground dark:hover:bg-ink dark:hover:text-muted-foreground"
       )}
      >
       {isBlank ? (
        <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
       ) : t.kind === "pdf" ? (
        <FileText className="h-3.5 w-3.5 shrink-0 text-brick" aria-hidden="true" />
       ) : (
        <span
         className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          isActive ? "bg-paper-3" : "bg-paper-3 dark:bg-ink-2"
         )}
         aria-hidden="true"
        />
       )}
       <span className="min-w-0 flex-1 truncate">
        {isBlank ? "New tab" : t.title}
       </span>
       {tabs.length > 1 ? (
        <button
         type="button"
         aria-label={`Close tab ${isBlank ? "New tab" : t.title}`}
         onClick={(e) => { e.stopPropagation(); onClose(t.id) }}
         className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-opacity hover:bg-paper-3 hover:text-foreground focus-visible:opacity-100 dark:hover:bg-ink dark:hover:text-muted-foreground",
          // Always visible on active tab + touch (no hover); hover-reveal on desktop inactive.
          isActive ? "opacity-100" : "opacity-60 md:opacity-0 md:group-hover:opacity-100"
         )}
        >
         <X className="h-3.5 w-3.5" />
        </button>
       ) : null}
      </div>
     )
    })}
   </div>

   <button
    type="button"
    onClick={onNew}
    aria-label="Open new tab"
    title="New tab"
    className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-paper-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:text-muted-foreground dark:hover:bg-ink dark:hover:text-paper"
   >
    <Plus className="h-4 w-4" />
   </button>
  </div>
 )
}
