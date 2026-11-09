import type { ReactNode } from "react"

export interface FilterOption {
  id: string
  name: string
}

export type FilterControl =
  | {
      kind: "searchable"
      id: string
      label: string
      allLabel: string
      searchPlaceholder?: string
      options: FilterOption[]
      value: string
      onChange: (value: string) => void
    }
  | {
      kind: "select"
      id: string
      label: string
      value: string
      options: { value: string; label: string }[]
      onChange: (value: string) => void
    }
  | {
      kind: "text"
      id: string
      label: string
      placeholder?: string
      value: string
      onChange: (value: string) => void
    }
  | {
      kind: "number"
      id: string
      label: string
      placeholder?: string
      min?: number
      value: string
      onChange: (value: string) => void
    }
  | {
      kind: "toggle"
      id: string
      label: string
      description?: string
      checked: boolean
      onChange: (checked: boolean) => void
    }
  | {
      kind: "dateRange"
      id: string
      label: string
      from: string
      to: string
      onChange: (from: string, to: string) => void
    }

export interface SortOption {
  value: string
  label: string
}

export interface QuickFilter {
  id: string
  label: string
  active: boolean
  onToggle: () => void
}

export interface ActiveFilterChip {
  id: string
  label: string
  onRemove: () => void
}

export interface ListingFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  onSearchSubmit?: () => void
  searchPlaceholder: string
  filters?: FilterControl[]
  quickFilters?: QuickFilter[]
  onClear: () => void
  hasActiveFilters: boolean
  /** Number of active facets, shown as a badge on the mobile Filters button. */
  activeCount?: number
  children?: ReactNode
}
