"use client"

import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { ActiveFilterChips } from "@/components/listing/ActiveFilterChips"
import type { ActiveFilterChip, SortOption } from "@/components/listing/types"

interface ListingToolbarProps {
  count: number
  total: number
  label: string
  refreshing?: boolean
  sort?: { value: string; options: SortOption[]; onChange: (value: string) => void }
  activeFilters?: ActiveFilterChip[]
  onClearAll?: () => void
  children?: ReactNode
}

export function ListingToolbar({
  count,
  total,
  label,
  refreshing = false,
  sort,
  activeFilters = [],
  onClearAll,
  children,
}: ListingToolbarProps) {
  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
          <span>
            Showing <b className="text-foreground">{count}</b> of <b className="text-foreground">{total}</b> {label}
          </span>
          {refreshing ? (
            <span className="inline-flex items-center gap-1 text-xs text-brick">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Refreshing…
            </span>
          ) : null}
        </p>

        <div className="flex items-center gap-3">
          {children}
          {sort && sort.options.length > 1 ? (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Sort by</span>
              <select
                value={sort.value}
                onChange={(event) => sort.onChange(event.target.value)}
                aria-label={`Sort ${label}`}
                className="h-9 border border-rule bg-background px-2 text-xs font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--color-focus)]"
              >
                {sort.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>

      <ActiveFilterChips filters={activeFilters} onClearAll={onClearAll} />
    </div>
  )
}
