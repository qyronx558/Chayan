"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronsUpDown } from "lucide-react"
import { fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"
import { allCountries, canonicalCity, countryName, toCountryCode } from "@/lib/private-jobs/geo"
import { Button } from "@/components/ui/button"
import { RelationPicker } from "./picker/RelationPicker"
import type { PickerItem } from "./picker/picker-utils"

interface CountryRow {
  code: string
  name: string
  count: number
}

function Trigger({ label, placeholder, disabled, onClick }: { label: string | null; placeholder: string; disabled?: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      disabled={disabled}
      onClick={onClick}
      className={cn("h-10 w-full min-w-0 justify-between px-3 py-2 text-sm font-normal", !label && "text-muted-foreground")}
    >
      <span className="min-w-0 flex-1 truncate text-left">{label ?? placeholder}</span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  )
}

/**
 * Country picker for job forms: countries already used by jobs first (with
 * counts), then every country; a country that is not in the list can be created.
 * The value is an ISO code ("IN") or the custom name.
 */
export function CountrySelect({ value, onChange, disabled }: { value: string | null | undefined; onChange: (v: string | null) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const q = useQuery({
    queryKey: ["geo", "countries"],
    queryFn: () => fetcher<{ data: CountryRow[] }>("/api/private-jobs/countries"),
    staleTime: 5 * 60_000,
  })
  const items: PickerItem[] = useMemo(() => {
    const rows = q.data?.data ?? allCountries().map((c) => ({ ...c, count: 0 }))
    const list = rows.map((c) => ({ id: c.code, name: c.count ? `${c.name} (${c.count} jobs)` : c.name }))
    if (value && !list.some((i) => i.id === value)) list.unshift({ id: value, name: countryName(value) })
    return list
  }, [q.data, value])

  return (
    <>
      <Trigger label={value ? countryName(value) : null} placeholder="Select country" disabled={disabled} onClick={() => setOpen(true)} />
      <RelationPicker
        open={open}
        onOpenChange={setOpen}
        items={items}
        value={value ?? null}
        onSelect={(id) => onChange(id)}
        onCreate={async (name) => {
          const code = toCountryCode(name)
          const id = code ?? name.trim().replace(/\s+/g, " ").slice(0, 60)
          return id ? { id, name: countryName(id) } : null
        }}
        title="Select Country"
        subtitle="Countries with openings are listed first. Not listed? Add it."
        singular="Country"
        plural="countries"
        loading={q.isLoading}
        allowCreate
        allowNone
        noneLabel="Not specified"
        onClear={() => onChange(null)}
        searchPlaceholder="Search countries..."
      />
    </>
  )
}

/**
 * City picker, enabled once a country is chosen: lists the cities that already
 * have jobs in that country; a new city can be created.
 */
export function CitySelect({
  country,
  value,
  onChange,
}: {
  country: string | null | undefined
  value: string | null | undefined
  onChange: (v: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const q = useQuery({
    queryKey: ["geo", "cities", country],
    queryFn: () => fetcher<{ data: { name: string; count: number }[] }>(`/api/private-jobs/cities?country=${encodeURIComponent(country!)}&scope=all`),
    enabled: !!country,
    staleTime: 5 * 60_000,
  })
  const items: PickerItem[] = useMemo(() => {
    const list = (q.data?.data ?? []).map((c) => ({ id: c.name, name: `${c.name} (${c.count} jobs)` }))
    if (value && !list.some((i) => i.id === value)) list.unshift({ id: value, name: value })
    return list
  }, [q.data, value])

  return (
    <>
      <Trigger label={value || null} placeholder={country ? "Select city" : "Select a country first"} disabled={!country} onClick={() => setOpen(true)} />
      <RelationPicker
        open={open && !!country}
        onOpenChange={setOpen}
        items={items}
        value={value ?? null}
        onSelect={(id) => onChange(id)}
        onCreate={async (name) => {
          const city = canonicalCity(name)
          return city ? { id: city, name: city } : null
        }}
        title="Select City"
        subtitle={country ? `Cities with openings in ${countryName(country)}. Not listed? Add it.` : "Choose a country first"}
        singular="City"
        plural="cities"
        loading={q.isLoading}
        allowCreate
        allowNone
        noneLabel="Not specified"
        onClear={() => onChange(null)}
        searchPlaceholder="Search cities..."
      />
    </>
  )
}
