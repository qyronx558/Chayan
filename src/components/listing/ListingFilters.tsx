"use client"

import { useEffect, useState } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SearchableFilter } from "@/components/jobs/SearchableFilter"
import { cn } from "@/lib/utils"
import type { FilterControl, ListingFiltersProps } from "@/components/listing/types"

function SearchBox({
  value,
  onChange,
  onSearchSubmit,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  onSearchSubmit?: () => void
  placeholder: string
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSearchSubmit?.()
      }}
      className="relative"
      role="search"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        data-listing-search
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 pl-10 pr-12"
        aria-label={placeholder}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-brick"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 border border-rule px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
          /
        </kbd>
      )}
    </form>
  )
}

function FilterControlItem({ control }: { control: FilterControl }) {
  if (control.kind === "searchable") {
    return (
      <div className="space-y-1.5">
        <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {control.label}
        </span>
        <SearchableFilter
          value={control.value}
          options={control.options}
          allLabel={control.allLabel}
          searchPlaceholder={control.searchPlaceholder}
          onChange={control.onChange}
          disabled={control.disabled}
          popoverClassName="z-[60]"
        />
      </div>
    )
  }

  if (control.kind === "select") {
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={`filter-${control.id}`}
          className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
        >
          {control.label}
        </label>
        <select
          id={`filter-${control.id}`}
          value={control.value}
          onChange={(event) => control.onChange(event.target.value)}
          className="h-10 w-full min-w-0 truncate border border-rule bg-background px-2.5 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--color-focus)]"
        >
          {control.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (control.kind === "text" || control.kind === "number") {
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={`filter-${control.id}`}
          className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
        >
          {control.label}
        </label>
        <Input
          id={`filter-${control.id}`}
          type={control.kind === "number" ? "number" : "text"}
          min={control.kind === "number" ? control.min : undefined}
          inputMode={control.kind === "number" ? "numeric" : undefined}
          placeholder={control.placeholder}
          value={control.value}
          onChange={(event) => control.onChange(event.target.value)}
          className="h-10 bg-background text-sm"
        />
      </div>
    )
  }

  if (control.kind === "toggle") {
    return (
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">{control.label}</span>
          {control.description ? (
            <span className="block text-xs leading-4 text-muted-foreground">{control.description}</span>
          ) : null}
        </span>
        <Switch checked={control.checked} onCheckedChange={control.onChange} aria-label={control.label} />
      </label>
    )
  }

  return (
    <div className="space-y-1.5">
      <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {control.label}
      </span>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={control.from}
          onChange={(event) => control.onChange(event.target.value, control.to)}
          className="h-10 bg-background px-2 text-xs"
          aria-label={`${control.label} from`}
        />
        <Input
          type="date"
          value={control.to}
          onChange={(event) => control.onChange(control.from, event.target.value)}
          className="h-10 bg-background px-2 text-xs"
          aria-label={`${control.label} to`}
        />
      </div>
    </div>
  )
}

function FilterPanel({
  search,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder,
  filters,
  quickFilters,
  onClear,
  hasActiveFilters,
}: ListingFiltersProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-foreground">Filters</h2>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-brick underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <SearchBox
        value={search}
        onChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
        placeholder={searchPlaceholder}
      />

      {quickFilters && quickFilters.length > 0 ? (
        <div className="space-y-1.5">
          <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Quick filters
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={filter.active}
                onClick={filter.onToggle}
                className={cn(
                  "border px-2.5 py-1 text-xs font-medium transition-colors",
                  filter.active
                    ? "border-foreground bg-foreground text-background"
                    : "border-rule text-muted-foreground hover:border-foreground hover:text-foreground"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {filters && filters.length > 0 ? (
        <div className="space-y-4 border-t border-rule pt-4">
          {filters.map((control) => (
            <FilterControlItem key={control.id} control={control} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Sticky left filter rail for listing pages.
 * Mobile renders a compact search + Filters button that opens a left Sheet.
 */
export function ListingFilters(props: ListingFiltersProps) {
  const [open, setOpen] = useState(false)
  const { activeCount = 0 } = props

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return
      }
      const input = Array.from(
        document.querySelectorAll<HTMLInputElement>("input[data-listing-search]")
      ).find((element) => element.offsetParent !== null)
      if (input) {
        event.preventDefault()
        input.focus()
        input.select()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="mb-6 flex items-center gap-2 lg:hidden">
        <div className="min-w-0 flex-1">
          <SearchBox
            value={props.search}
            onChange={props.onSearchChange}
            onSearchSubmit={props.onSearchSubmit}
            placeholder={props.searchPlaceholder}
          />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-11 shrink-0">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {activeCount > 0 ? (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center bg-foreground px-1 text-[10px] font-bold text-background">
                  {activeCount}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] overflow-y-auto border-rule sm:max-w-sm">
            <SheetHeader className="text-left">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-5">
              <FilterPanel {...props} />
            </div>
            {/* Filters apply instantly; this gives a clear, thumb-sized way back to the list. */}
            <div className="sticky -bottom-6 -mx-6 -mb-6 mt-6 border-t border-rule bg-background px-6 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
              <SheetClose asChild>
                <Button className="h-12 w-full text-base font-semibold">Show results</Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden max-h-[calc(100vh-7.5rem)] overflow-y-auto overscroll-contain border border-rule bg-background p-5 lg:block">
        <FilterPanel {...props} />
      </div>
    </div>
  )
}
