"use client"

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react"
import { CalendarDays, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn, formatDate } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import type { FilterControl, FilterOption, ListingFiltersProps } from "@/components/listing/types"

/*
 * The admissions filter rail, drawn as things on an admission-office desk.
 * Purely presentational: it receives exactly the same props as the shared
 * ListingFilters and calls exactly the same handlers, so the page's state,
 * URL sync and API queries are untouched.
 *
 * - search: an oval pill
 * - category / department: a pill that opens the office register, with a
 *   thumb index (A–Z) down the side, the way ledgers are cut
 * - posted: choices you circle with a pen
 * - last date: a pill that opens a calendar slip with "from" / "to"
 * - toggles: boxes you tick by hand
 */

const TICK = "M3 13.5 C 5.5 15, 8 18, 10 21 C 13 13, 18 7, 25 2.5"

function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  const cls = cn(handFont.className, "mb-1.5 block text-[1.08rem] leading-none text-foreground/75")
  return htmlFor ? (
    <label htmlFor={htmlFor} className={cls}>
      {children}
    </label>
  ) : (
    <span className={cls}>{children}</span>
  )
}

/* ── oval search ── */
function PillSearch({ value, onChange, onSubmit, placeholder }: { value: string; onChange: (v: string) => void; onSubmit?: () => void; placeholder: string }) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
      className="group relative flex h-11 items-center rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] pl-4 pr-1.5 transition-[border-color,box-shadow] focus-within:border-[var(--hs-trust)] focus-within:shadow-[0_0_0_4px_var(--hs-trust-soft)]"
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        data-listing-search
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent px-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search" className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-paper-2 hover:text-brick">
          <X className="h-4 w-4" />
        </button>
      ) : (
        <kbd className="mr-1.5 hidden rounded-full border border-[var(--hs-border-strong)] px-2 py-0.5 text-[10px] text-muted-foreground sm:block">/</kbd>
      )}
    </form>
  )
}

/* ── a pill that shows the current choice and opens something ── */
function ChoicePill({ value, placeholder, active, onClick, onClear, icon }: { value: string; placeholder: string; active: boolean; onClick: () => void; onClear?: () => void; icon?: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-10 w-full items-center rounded-full border pl-4 pr-1 text-sm transition-colors",
        active ? "border-[var(--hs-trust)] bg-[var(--hs-trust-soft)]" : "border-[var(--hs-border-strong)] bg-[var(--hs-surface)] hover:border-[var(--hs-trust)]"
      )}
    >
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <span className={cn("min-w-0 flex-1 truncate", active ? "font-semibold text-foreground" : "text-muted-foreground")}>{active ? value : placeholder}</span>
        {icon ?? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {active && onClear ? (
        <button type="button" onClick={onClear} aria-label={`Clear ${placeholder}`} className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-paper-2 hover:text-brick">
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span className="w-2" />
      )}
    </div>
  )
}

/* ── the office register: searchable list with a thumb index ── */
function RegisterDialog({
  open,
  onOpenChange,
  title,
  allLabel,
  searchPlaceholder,
  options,
  value,
  onChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  allLabel: string
  searchPlaceholder?: string
  options: FilterOption[]
  value: string
  onChange: (v: string) => void
}) {
  const [q, setQ] = useState("")
  const [letter, setLetter] = useState("")

  const sorted = useMemo(() => [...options].sort((a, b) => a.name.localeCompare(b.name)), [options])
  const letters = useMemo(() => [...new Set(sorted.map((o) => o.name.trim()[0]?.toUpperCase()).filter((c): c is string => !!c && /[A-Z]/.test(c)))], [sorted])
  const shown = sorted.filter((o) => {
    if (q && !o.name.toLowerCase().includes(q.toLowerCase())) return false
    if (letter && !q && o.name.trim()[0]?.toUpperCase() !== letter) return false
    return true
  })

  const pick = (v: string) => {
    onChange(v)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) {
          setQ("")
          setLetter("")
        }
      }}
    >
      <DialogContent className="home-saas max-w-lg gap-0 overflow-visible rounded-[4px] border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] p-0 text-foreground sm:rounded-[4px]">
        {/* cloth-bound spine of the register */}
        <div className="flex">
          <div className="hidden w-4 shrink-0 rounded-l-[4px] sm:block" style={{ background: "repeating-linear-gradient(180deg, oklch(42% 0.09 28) 0 6px, oklch(38% 0.08 28) 6px 7px)" }} aria-hidden />
          <div className="min-w-0 flex-1 p-5 sm:p-6">
            <p className={cn(typeFont.className, "text-[10.5px] text-muted-foreground")}>OFFICE REGISTER</p>
            <DialogTitle className="mt-0.5 font-display text-2xl font-bold">{title}</DialogTitle>
            <DialogDescription className={cn(handFont.className, "mt-0.5 text-[1.02rem] text-muted-foreground")}>
              turn to a letter, or just start typing
            </DialogDescription>

            <div className="mt-4">
              <PillSearch value={q} onChange={setQ} placeholder={searchPlaceholder || "Search…"} />
            </div>

            <div className="relative mt-4 flex gap-3">
              {/* ruled ledger page */}
              <ul
                className="hs-scroll max-h-[46vh] min-w-0 flex-1 overflow-y-auto rounded-[3px] border border-[var(--hs-border)] py-1"
                style={{
                  backgroundImage: "linear-gradient(90deg, transparent 2.1rem, color-mix(in oklch, var(--color-brick) 45%, transparent) 2.1rem, color-mix(in oklch, var(--color-brick) 45%, transparent) calc(2.1rem + 1px), transparent calc(2.1rem + 1px))",
                }}
              >
                {!q && !letter && (
                  <RegisterRow label={allLabel} selected={value === ""} onClick={() => pick("")} index="—" />
                )}
                {shown.map((o, i) => (
                  <RegisterRow key={o.id} label={o.name} selected={value === o.id} onClick={() => pick(o.id)} index={String(i + 1)} />
                ))}
                {shown.length === 0 && (
                  <li className={cn(handFont.className, "px-4 py-8 text-center text-[1.1rem] text-muted-foreground")}>nothing written under that one</li>
                )}
              </ul>

              {/* thumb index cut into the page edge */}
              {letters.length > 4 && (
                <div className="hs-scroll flex max-h-[46vh] w-7 shrink-0 flex-col overflow-y-auto" aria-label="Jump to letter">
                  {letters.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        setQ("")
                        setLetter(letter === l ? "" : l)
                      }}
                      aria-pressed={letter === l}
                      className={cn(
                        typeFont.className,
                        "-mb-px rounded-r-[5px] border border-l-0 py-0.5 text-[11px] font-bold transition-colors",
                        letter === l ? "border-[var(--hs-trust)] bg-[var(--hs-trust)] text-[var(--hs-trust-ink)]" : "border-[var(--hs-border-strong)] bg-[var(--hs-surface-2)] text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RegisterRow({ label, selected, onClick, index }: { label: string; selected: boolean; onClick: () => void; index: string }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center gap-3 border-b border-[color-mix(in_oklch,oklch(62%_0.09_240)_22%,transparent)] py-2 pl-2 pr-3 text-left hover:bg-[var(--hs-trust-soft)]"
      >
        <span className={cn(typeFont.className, "w-6 shrink-0 text-right text-[10.5px] text-muted-foreground")}>{index}</span>
        <span className={cn("min-w-0 flex-1 pl-2 text-sm", selected ? "font-semibold text-foreground" : "text-foreground/85")}>{label}</span>
        {selected && (
          <svg viewBox="0 0 28 24" className="h-5 w-6 shrink-0 text-[var(--hs-trust)]" fill="none" aria-label="selected">
            <path d={TICK} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </li>
  )
}

/* ── last-date calendar slip ── */
function DateSlipDialog({ open, onOpenChange, label, from, to, onChange }: { open: boolean; onOpenChange: (o: boolean) => void; label: string; from: string; to: string; onChange: (f: string, t: string) => void }) {
  const field = "h-11 w-full rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-4 text-sm text-foreground outline-none focus-visible:border-[var(--hs-trust)] focus-visible:shadow-[0_0_0_4px_var(--hs-trust-soft)]"
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="home-saas max-w-sm gap-0 overflow-hidden rounded-[4px] border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] p-0 text-foreground sm:rounded-[4px]">
        <div className="bg-[var(--color-brick)] px-6 pb-3 pt-4 text-center text-[var(--color-brick-ink)]">
          <span className="mx-auto mb-2 flex w-16 justify-between" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-paper)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-paper)]" />
          </span>
          <DialogTitle className="font-display text-xl font-bold">{label}</DialogTitle>
          <DialogDescription className={cn(handFont.className, "text-[1rem] text-[var(--color-brick-ink)]/80")}>between which two days?</DialogDescription>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <Label htmlFor="desk-date-from">from</Label>
            <input id="desk-date-from" type="date" value={from} onChange={(e) => onChange(e.target.value, to)} className={field} />
          </div>
          <div>
            <Label htmlFor="desk-date-to">to</Label>
            <input id="desk-date-to" type="date" value={to} onChange={(e) => onChange(from, e.target.value)} className={field} />
          </div>
          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={() => onChange("", "")} className={cn(handFont.className, "text-[1.05rem] text-brick underline decoration-wavy decoration-1 underline-offset-4")}>
              rub it out
            </button>
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-semibold text-[var(--color-paper)]">
              Done
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── one control ── */
function DeskControl({ control }: { control: FilterControl }) {
  const [open, setOpen] = useState(false)

  if (control.kind === "searchable") {
    const selected = control.options.find((o) => o.id === control.value)
    return (
      <div>
        <Label>{control.label.toLowerCase()}</Label>
        <ChoicePill
          value={selected?.name ?? control.allLabel}
          placeholder={control.allLabel}
          active={!!selected}
          onClick={() => !control.disabled && setOpen(true)}
          onClear={() => control.onChange("")}
        />
        <RegisterDialog
          open={open}
          onOpenChange={setOpen}
          title={control.label}
          allLabel={control.allLabel}
          searchPlaceholder={control.searchPlaceholder}
          options={control.options}
          value={control.value}
          onChange={control.onChange}
        />
      </div>
    )
  }

  if (control.kind === "select" && control.options.length > 6) {
    /* a long list reads better as a register than as a row of circles */
    const none = control.options.find((o) => o.value === "")
    const opts = control.options.filter((o) => o.value !== "").map((o) => ({ id: o.value, name: o.label }))
    const current = opts.find((o) => o.id === control.value)
    return (
      <div>
        <Label>{control.label.toLowerCase()}</Label>
        <ChoicePill
          value={current?.name ?? none?.label ?? "Any"}
          placeholder={none?.label ?? "Any"}
          active={!!current}
          onClick={() => setOpen(true)}
          onClear={() => control.onChange("")}
        />
        <RegisterDialog
          open={open}
          onOpenChange={setOpen}
          title={control.label}
          allLabel={none?.label ?? "Any"}
          options={opts}
          value={control.value}
          onChange={control.onChange}
        />
      </div>
    )
  }

  if (control.kind === "select") {
    /* choices you circle with a pen */
    return (
      <div role="radiogroup" aria-label={control.label}>
        <Label>{control.label.toLowerCase()}</Label>
        <div className="flex flex-wrap gap-x-1 gap-y-1.5">
          {control.options.map((o, i) => {
            const on = control.value === o.value
            return (
              <button
                key={o.value || "any"}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => control.onChange(o.value)}
                className={cn("relative px-3 py-1.5 text-[13px] transition-colors", on ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {on && (
                  <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
                    <path
                      className="hs-draw"
                      d={i % 2 ? "M55 3 C 84 2, 98 10, 97 20 C 96 31, 74 37, 50 37 C 24 37, 3 31, 3 20 C 3 9, 22 3, 46 3 C 58 3, 68 4, 76 7" : "M45 3 C 16 3, 2 10, 3 20 C 4 31, 26 37, 50 37 C 76 37, 97 30, 97 19 C 97 9, 78 3, 54 3 C 42 3, 32 4, 24 7"}
                      fill="none"
                      stroke="var(--color-brick)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      style={{ ["--len" as string]: 280, animationDuration: ".5s" } as CSSProperties}
                    />
                  </svg>
                )}
                {o.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (control.kind === "dateRange") {
    const has = !!(control.from || control.to)
    const text = has ? `${control.from ? formatDate(control.from, "d MMM") : "any"} → ${control.to ? formatDate(control.to, "d MMM yyyy") : "any"}` : "any day"
    return (
      <div>
        <Label>{control.label.toLowerCase()}</Label>
        <ChoicePill
          value={text}
          placeholder="any day"
          active={has}
          onClick={() => setOpen(true)}
          onClear={() => control.onChange("", "")}
          icon={<CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />}
        />
        <DateSlipDialog open={open} onOpenChange={setOpen} label={control.label} from={control.from} to={control.to} onChange={control.onChange} />
      </div>
    )
  }

  if (control.kind === "toggle") {
    /* a box you tick by hand */
    return (
      <button type="button" role="checkbox" aria-checked={control.checked} onClick={() => control.onChange(!control.checked)} className="group flex w-full items-start gap-3 py-1 text-left">
        <span className="relative mt-0.5 h-[18px] w-[18px] shrink-0 rounded-[3px] border-[1.5px] border-[var(--hs-border-strong)] group-hover:border-[var(--hs-trust)]">
          {control.checked && (
            <svg viewBox="0 0 28 24" className="absolute -right-1.5 -top-2 h-6 w-7 text-[var(--hs-trust)]" fill="none" aria-hidden>
              <path className="hs-draw" d={TICK} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ ["--len" as string]: 40, animationDuration: ".3s" } as CSSProperties} />
            </svg>
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">{control.label}</span>
          {control.description && <span className="block text-xs leading-4 text-muted-foreground">{control.description}</span>}
        </span>
      </button>
    )
  }

  /* text / number: an oval field */
  return (
    <div>
      <Label htmlFor={`desk-${control.id}`}>{control.label.toLowerCase()}</Label>
      <input
        id={`desk-${control.id}`}
        type={control.kind === "number" ? "number" : "text"}
        min={control.kind === "number" ? control.min : undefined}
        placeholder={control.placeholder}
        value={control.value}
        onChange={(e) => control.onChange(e.target.value)}
        className="h-10 w-full rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-4 text-sm outline-none focus-visible:border-[var(--hs-trust)]"
      />
    </div>
  )
}

/* ── the full panel ── */
function DeskPanel(props: ListingFiltersProps) {
  const { search, onSearchChange, onSearchSubmit, searchPlaceholder, filters = [], quickFilters = [], onClear, hasActiveFilters } = props
  const toggles = filters.filter((f) => f.kind === "toggle")
  const others = filters.filter((f) => f.kind !== "toggle")
  return (
    <div className="space-y-5">
      {props.railTop ? <div className="border-b border-dashed border-[var(--hs-border-strong)] pb-5">{props.railTop}</div> : null}
      <div className="flex items-center justify-between">
        <span className={cn(handFont.className, "text-[1.3rem] leading-none text-foreground")}>narrow it down</span>
        {hasActiveFilters && (
          <button type="button" onClick={onClear} className={cn(handFont.className, "text-[1.02rem] text-brick underline decoration-wavy decoration-1 underline-offset-4")}>
            rub it all out
          </button>
        )}
      </div>

      <PillSearch value={search} onChange={onSearchChange} onSubmit={onSearchSubmit} placeholder={searchPlaceholder} />

      {quickFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((f, i) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={f.active}
              onClick={f.onToggle}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                i % 2 ? "rotate-[1deg]" : "-rotate-[1deg]",
                f.active
                  ? "border-[var(--hs-trust)] bg-[var(--hs-trust)] text-[var(--hs-trust-ink)] shadow-[0_2px_0_color-mix(in_oklch,var(--hs-trust)_60%,black)]"
                  : "border-[var(--hs-border-strong)] bg-[var(--hs-surface)] text-muted-foreground hover:border-[var(--hs-trust)] hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4 border-t border-dashed border-[var(--hs-border-strong)] pt-4">
        {others.map((c) => (
          <DeskControl key={c.id} control={c} />
        ))}
      </div>

      {toggles.length > 0 && (
        <div className="space-y-1.5 border-t border-dashed border-[var(--hs-border-strong)] pt-4">
          {toggles.map((c) => (
            <DeskControl key={c.id} control={c} />
          ))}
        </div>
      )}
      {props.railBottom ? <div className="border-t border-dashed border-[var(--hs-border-strong)] pt-5">{props.railBottom}</div> : null}
    </div>
  )
}

/** Same contract as ListingFilters (sticky rail on desktop, sheet on phones). */
export function DeskFilters(props: ListingFiltersProps) {
  const [open, setOpen] = useState(false)
  const { activeCount = 0 } = props

  /* "/" focuses the search, same shortcut as the shared rail */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return
      const t = event.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return
      const input = Array.from(document.querySelectorAll<HTMLInputElement>("input[data-listing-search]")).find((el) => el.offsetParent !== null)
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
      {/* phones: oval search + a "Filters" pill that opens the desk as a sheet */}
      <div className="mb-6 flex items-center gap-2 lg:hidden">
        <div className="min-w-0 flex-1">
          <PillSearch value={props.search} onChange={props.onSearchChange} onSubmit={props.onSearchSubmit} placeholder={props.searchPlaceholder} />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button type="button" className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-[var(--hs-border-strong)] bg-[var(--hs-surface)] px-4 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--hs-trust)] px-1 text-[10px] font-bold text-[var(--hs-trust-ink)]">{activeCount}</span>}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="home-saas w-[88vw] overflow-y-auto border-rule bg-[var(--hs-paper-slip)] sm:max-w-sm">
            <SheetHeader className="text-left">
              <SheetTitle className="sr-only">Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-2">
              <DeskPanel {...props} />
            </div>
            <div className="sticky -bottom-6 -mx-6 -mb-6 mt-6 border-t border-dashed border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] px-6 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
              <SheetClose asChild>
                <button type="button" className="h-12 w-full rounded-full bg-[var(--color-ink)] text-base font-semibold text-[var(--color-paper)]">
                  Show the list
                </button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:block">
        <DeskPanel {...props} />
      </div>
    </div>
  )
}
