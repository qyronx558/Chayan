"use client"

import { X } from "lucide-react"
import type { ActiveFilterChip } from "@/components/listing/types"

interface ActiveFilterChipsProps {
  filters: ActiveFilterChip[]
  onClearAll?: () => void
}

export function ActiveFilterChips({ filters, onClearAll }: ActiveFilterChipsProps) {
  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Active filters">
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={filter.onRemove}
          className="inline-flex max-w-full items-center gap-1 border border-rule bg-paper-2 px-2 py-1 text-xs text-foreground transition-colors hover:border-brick hover:text-brick"
        >
          <span className="truncate">{filter.label}</span>
          <X className="h-3 w-3 shrink-0" aria-hidden />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      {onClearAll ? (
        <button
          type="button"
          onClick={onClearAll}
          className="ml-1 text-xs font-semibold text-brick underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          Clear all
        </button>
      ) : null}
    </div>
  )
}
