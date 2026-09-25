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
        "group flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 shadow-sm transition-colors",
        "hover:border-blue-300 hover:bg-white hover:text-gray-700 hover:shadow",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30",
        "dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-blue-700 dark:hover:bg-gray-900 dark:hover:text-gray-200",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-gray-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400" />
      <span className="flex-1 truncate text-left">{placeholder}</span>
      {showKbd && (
        <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-gray-400 sm:inline-flex dark:border-gray-700 dark:bg-gray-950">
          Ctrl K
        </kbd>
      )}
    </button>
  )
}
