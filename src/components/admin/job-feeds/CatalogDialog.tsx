"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, Globe2, Loader2, MapPin, Search } from "lucide-react"
import { api, fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { T_PRIMARY } from "@/components/admin/list/tokens"
import { PROVIDER_LABEL, type CatalogRow } from "./types"

type Scope = "worldwide" | "india"

export function CatalogDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient()
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState("")
  const [scope, setScope] = useState<Scope>("worldwide")
  const catalog = useQuery({
    queryKey: ["job-feeds", "catalog"],
    queryFn: () => fetcher<{ data: CatalogRow[] }>("/api/admin/private-feeds/catalog"),
    enabled: open,
  })
  const rows = useMemo(() => catalog.data?.data ?? [], [catalog.data])
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? rows.filter((r) => r.company.toLowerCase().includes(q) || r.sector.toLowerCase().includes(q) || PROVIDER_LABEL[r.provider].toLowerCase().includes(q)) : rows
  }, [rows, query])
  const available = visible.filter((r) => !r.added)
  const allPicked = available.length > 0 && available.every((r) => picked.has(r.id))
  const bySector = useMemo(() => {
    const m = new Map<string, CatalogRow[]>()
    for (const r of visible) m.set(r.sector, [...(m.get(r.sector) ?? []), r])
    return [...m.entries()]
  }, [visible])
  const pickedJobs = useMemo(() => rows.filter((r) => picked.has(r.id)).reduce((n, r) => n + (r.jobs ?? 0), 0), [rows, picked])

  const add = useMutation({
    mutationFn: () => api.post<{ added: number }>("/api/admin/private-feeds/catalog", { ids: [...picked], scope }),
    onSuccess: (res) => {
      toast(`${res.added} companies added - their openings are imported over the next sync runs.`, "success")
      setPicked(new Set())
      qc.invalidateQueries({ queryKey: ["job-feeds"] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast(e.message, "destructive"),
  })

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = () =>
    setPicked((prev) => {
      const next = new Set(prev)
      for (const r of available) {
        if (allPicked) next.delete(r.id)
        else next.add(r.id)
      }
      return next
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Company catalog</DialogTitle>
          <DialogDescription>
            {rows.length ? `${rows.length} employers worldwide` : "Employers"} whose official job boards were verified to have
            open roles. Pick companies and they are imported automatically from then on.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search company, sector or job board" className="pl-9" aria-label="Search catalog" />
          </div>
          <div role="radiogroup" aria-label="Openings to import" className="grid grid-cols-2 gap-1 rounded-xl border border-rule p-1">
            {(
              [
                ["worldwide", "Worldwide", Globe2],
                ["india", "India & remote", MapPin],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={scope === value}
                onClick={() => setScope(value)}
                className={cn(
                  "flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
                  scope === value ? "bg-foreground text-background" : "hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {picked.size} selected{pickedJobs ? ` · ~${pickedJobs.toLocaleString("en-IN")} open roles` : ""} · {available.length} available
          </span>
          <button
            type="button"
            className="font-semibold text-foreground underline-offset-2 hover:underline disabled:opacity-50"
            disabled={!available.length}
            onClick={toggleAll}
          >
            {allPicked ? "Clear" : query ? "Select shown" : "Select all"}
          </button>
        </div>

        <div className="-mx-6 max-h-[50vh] overflow-y-auto px-6">
          {catalog.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11" />
              ))}
            </div>
          ) : !visible.length ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No company matches “{query}”. Use Discover to look it up.</p>
          ) : (
            bySector.map(([sector, items]) => (
              <section key={sector} className="mb-4">
                <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {sector} · {items.length}
                </h3>
                <div className="grid gap-1.5 sm:grid-cols-3">
                  {items.map((r) => (
                    <label
                      key={r.id}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-rule px-3 py-2",
                        r.added ? "cursor-default opacity-60" : picked.has(r.id) && "border-foreground"
                      )}
                    >
                      {r.added ? (
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Already added" />
                      ) : (
                        <Checkbox checked={picked.has(r.id)} onCheckedChange={() => toggle(r.id)} aria-label={`Add ${r.company}`} />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{r.company}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {r.added ? "Added" : PROVIDER_LABEL[r.provider]}
                          {r.jobs ? ` · ${r.jobs.toLocaleString("en-IN")} roles` : ""}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className={T_PRIMARY} disabled={!picked.size || add.isPending} onClick={() => add.mutate()}>
            {add.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Add {picked.size || ""} {picked.size === 1 ? "company" : "companies"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
