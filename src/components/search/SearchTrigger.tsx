"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchTriggerProps {
  onTrigger: () => void
  placeholder?: string
  className?: string
  showKbd?: boolean
  label?: string
}

/**
 * Visible search entry point. A fake input (button) that opens the global
 * SearchDialog. Keeps all live-search logic in one place (SearchDialog).
 */
export function SearchTrigger({
  onTrigger,
  placeholder = "Search jobs, results, exams...",
  className,
  showKbd = true,
  label = "Search",
}: SearchTriggerProps) {
  return (
    <button
      type="button"
      role="search"
      aria-label={label}
      onClick={onTrigger}
      className={cn(
        "group flex h-10 items-center gap-2 border border-rule bg-transparent px-3 text-sm text-muted-foreground transition-colors",
        "hover:border-rule-2 hover:text-foreground",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 transition-colors group-hover:text-brick" />
      <span className="flex-1 truncate text-left">{placeholder}</span>
      {showKbd && (
        <kbd className="hidden shrink-0 items-center gap-0.5 border border-rule px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">
          Ctrl K
        </kbd>
      )}
    </button>
  )
}
