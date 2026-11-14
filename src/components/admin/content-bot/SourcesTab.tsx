"use client"

import { useEffect, useState } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ExternalLink, Loader2, Pencil, Plus, Search, Trash2, Eye } from "lucide-react"
import { api, fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { T_CARD, T_HEAD_CELL, T_PRIMARY } from "@/components/admin/list/tokens"
import type { PreviewResponse, SourceRow, SourcesResponse } from "./types"
import { LEVEL_LABEL } from "./types"

const ALL = "all"

// ─── preview ────────────────────────────────────────────────────────

function PreviewList({ data }: { data: PreviewResponse }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground">
        Found <strong>{data.found}</strong> links, <strong>{data.relevant}</strong> look like jobs / results / admit cards.
        {data.empty && " The board says it has no notices right now."}
      </p>
      {data.found === 0 && !data.empty && (
        <p className="text-sm text-brick">No notice links matched. Try a different listing URL or loosen the link pattern (e.g. [.]pdf).</p>
      )}
      <ul className="max-h-64 divide-y divide-rule overflow-y-auto rounded-xl border border-rule">
        {data.items.map((it) => (
          <li key={it.url} className="flex items-start gap-2 px-3 py-2 text-sm">
            <Badge variant="secondary" className={cn("mt-0.5 shrink-0 border-0", it.triage.relevant ? "bg-paper-3" : "bg-paper-2 text-muted-foreground")}>
              {it.triage.relevant ? (it.triage.kind ?? "relevant") : "skip"}
            </Badge>
            <a href={it.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-foreground hover:text-brick" title={it.title}>
              {it.title}
            </a>
            {it.date && <span className="shrink-0 text-xs text-muted-foreground">{it.date}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── add / edit dialog ──────────────────────────────────────────────

interface SourceForm {
  name: string
  level: "CENTRAL" | "STATE" | "DISTRICT"
  adapter: "html-links" | "nic-s3waas"
  url: string
  state: string
  district: string
  department: string
  include: string
  allowHosts: string
}

const EMPTY: SourceForm = { name: "", level: "STATE", adapter: "html-links", url: "", state: "", district: "", department: "", include: "[.]pdf", allowHosts: "" }

function toDef(f: SourceForm) {
  return {
    name: f.name.trim(),
    level: f.level,
    adapter: f.adapter,
    url: f.url.trim(),
    state: f.level === "CENTRAL" ? undefined : f.state.trim() || undefined,
    district: f.level === "DISTRICT" ? f.district.trim() || undefined : undefined,
    department: f.department.trim() || undefined,
    include: f.include.trim() || undefined,
    allowHosts: f.allowHosts.split(/[,\s]+/).map((h) => h.trim()).filter(Boolean),
  }
}

function formFor(editing: SourceRow | null): SourceForm {
  return editing
    ? {
        name: editing.name,
        level: editing.level,
        adapter: editing.adapter,
        url: editing.url,
        state: editing.state ?? "",
        district: editing.district ?? "",
        department: editing.department ?? "",
        include: editing.include ?? "",
        allowHosts: (editing.allowHosts ?? []).join(", "),
      }
    : EMPTY
}

/** Mounted fresh (keyed) each time it opens, so the form starts from the source being edited. */
function SourceDialog({ editing, states, onClose }: { editing: SourceRow | null; states: string[]; onClose: () => void }) {
  const qc = useQueryClient()
  const [f, setF] = useState<SourceForm>(() => formFor(editing))
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const set = <K extends keyof SourceForm>(k: K, v: SourceForm[K]) => setF((x) => ({ ...x, [k]: v }))

  const check = useMutation({
    mutationFn: () => api.post<PreviewResponse>("/api/admin/content-bot/preview", { def: toDef(f) }),
    onSuccess: setPreview,
    onError: (e: Error) => {
      setPreview(null)
      toast(e.message, "destructive")
    },
  })
  const save = useMutation({
    mutationFn: () =>
      editing ? api.patch("/api/admin/content-bot/sources", { id: editing.id, def: toDef(f) }) : api.post("/api/admin/content-bot/sources", toDef(f)),
    onSuccess: () => {
      toast(editing ? "Source updated." : "Source added - it is crawled from the next run.", "success")
      qc.invalidateQueries({ queryKey: ["content-bot", "sources"] })
      onClose()
    },
    onError: (e: Error) => toast(e.message, "destructive"),
  })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit source" : "Add a source"}</DialogTitle>
          <DialogDescription>
            Use the official page that lists recruitment / result notices. Only government and university domains are accepted.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Name *</label>
            <Input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Maharashtra Public Service Commission" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Listing page URL *</label>
            <Input value={f.url} onChange={(e) => set("url", e.target.value)} placeholder="https://mpsc.gov.in/adv_notification/8" spellCheck={false} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Level *</label>
            <Select value={f.level} onValueChange={(v) => set("level", v as SourceForm["level"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CENTRAL">Central</SelectItem>
                <SelectItem value="STATE">State</SelectItem>
                <SelectItem value="DISTRICT">District</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Page type</label>
            <Select value={f.adapter} onValueChange={(v) => set("adapter", v as SourceForm["adapter"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="html-links">Any website (links on the page)</SelectItem>
                <SelectItem value="nic-s3waas">NIC district portal (S3WaaS table)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {f.level !== "CENTRAL" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">State * (exact name)</label>
              <Input value={f.state} onChange={(e) => set("state", e.target.value)} list="content-bot-states" placeholder="Maharashtra" />
              <datalist id="content-bot-states">
                {states.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
          )}
          {f.level === "DISTRICT" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">District * (exact name)</label>
              <Input value={f.district} onChange={(e) => set("district", e.target.value)} placeholder="Jaipur" />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Department (used when a notice names none)</label>
            <Input value={f.department} onChange={(e) => set("department", e.target.value)} placeholder="Maharashtra Public Service Commission" />
          </div>
          {f.adapter === "html-links" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Link pattern (regex)</label>
              <Input value={f.include} onChange={(e) => set("include", e.target.value)} placeholder="[.]pdf" spellCheck={false} />
              <p className="mt-1 text-[11px] text-muted-foreground">Only links matching this are read. [.]pdf = PDF files only.</p>
            </div>
          )}
          <div className={f.adapter === "html-links" ? "" : "sm:col-span-2"}>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Allowed extra hosts</label>
            <Input value={f.allowHosts} onChange={(e) => set("allowHosts", e.target.value)} placeholder="ibps.in, cdn.digialm.com" spellCheck={false} />
            <p className="mt-1 text-[11px] text-muted-foreground">Only if the board officially uses a non-.gov.in domain.</p>
          </div>
        </div>

        <div className="rounded-xl border border-rule p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">Check before saving</p>
            <Button type="button" variant="secondary" size="sm" disabled={check.isPending || !f.url.trim()} onClick={() => check.mutate()}>
              {check.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
              Check source
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Opens the page once and shows which notices the bot would pick up. No AI call, nothing is saved.</p>
          {preview && <div className="mt-3"><PreviewList data={preview} /></div>}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" className={T_PRIMARY} disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Add source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── tab ────────────────────────────────────────────────────────────

export function SourcesTab() {
  const qc = useQueryClient()
  const [input, setInput] = useState("")
  const [q, setQ] = useState("")
  const [level, setLevel] = useState(ALL)
  const [state, setState] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<{ open: boolean; editing: SourceRow | null }>({ open: false, editing: null })
  const [previewOf, setPreviewOf] = useState<{ row: SourceRow; data: PreviewResponse | null } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      if (input.trim() === q) return
      setQ(input.trim())
      setPage(1)
      setSelected(new Set())
    }, 300)
    return () => clearTimeout(t)
  }, [input, q])
  /** Any filter / page change drops the selection, so bulk actions never hit rows you can't see. */
  const refilter = (fn: () => void) => {
    fn()
    setSelected(new Set())
  }

  const params = new URLSearchParams({ page: String(page) })
  if (q) params.set("q", q)
  if (level !== ALL) params.set("level", level)
  if (state !== ALL) params.set("state", state)
  if (status !== ALL) params.set("status", status)
  const list = useQuery({
    queryKey: ["content-bot", "sources", params.toString()],
    queryFn: () => fetcher<SourcesResponse>(`/api/admin/content-bot/sources?${params}`),
    placeholderData: keepPreviousData,
  })

  const toggle = useMutation({
    mutationFn: ({ ids, enabled }: { ids: string[]; enabled: boolean }) => api.patch("/api/admin/content-bot/sources", { ids, enabled }),
    onSuccess: (_d, v) => {
      toast(`${v.ids.length} source${v.ids.length === 1 ? "" : "s"} switched ${v.enabled ? "on" : "off"}.`, "success")
      setSelected(new Set())
      qc.invalidateQueries({ queryKey: ["content-bot", "sources"] })
    },
    onError: (e: Error) => toast(e.message, "destructive"),
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/content-bot/sources?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      toast("Source deleted.", "success")
      qc.invalidateQueries({ queryKey: ["content-bot", "sources"] })
    },
    onError: (e: Error) => toast(e.message, "destructive"),
  })
  const check = useMutation({
    mutationFn: (row: SourceRow) => api.post<PreviewResponse>("/api/admin/content-bot/preview", { id: row.id }),
    onMutate: (row) => setPreviewOf({ row, data: null }),
    onSuccess: (data, row) => setPreviewOf({ row, data }),
    onError: (e: Error) => {
      setPreviewOf(null)
      toast(e.message, "destructive")
    },
  })

  const rows = list.data?.items ?? []
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / list.data.pageSize)) : 1
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search name, id, state, district or URL" className="pl-9" />
        </div>
        <div className="grid grid-cols-3 gap-2 lg:flex">
          <Select value={level} onValueChange={(v) => refilter(() => { setLevel(v); setPage(1) })}>
            <SelectTrigger className="lg:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All levels</SelectItem>
              <SelectItem value="CENTRAL">Central</SelectItem>
              <SelectItem value="STATE">State</SelectItem>
              <SelectItem value="DISTRICT">District</SelectItem>
            </SelectContent>
          </Select>
          <Select value={state} onValueChange={(v) => refilter(() => { setState(v); setPage(1) })}>
            <SelectTrigger className="lg:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All states</SelectItem>
              {(list.data?.states ?? []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => refilter(() => { setStatus(v); setPage(1) })}>
            <SelectTrigger className="lg:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>On and off</SelectItem>
              <SelectItem value="enabled">On only</SelectItem>
              <SelectItem value="disabled">Off only</SelectItem>
              <SelectItem value="custom">Added by admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="button" className={T_PRIMARY} onClick={() => setDialog({ open: true, editing: null })}>
          <Plus className="mr-1.5 h-4 w-4" /> Add source
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-rule bg-paper-2 px-4 py-2 text-sm">
          <span className="font-medium text-foreground">{selected.size} selected</span>
          <Button type="button" size="sm" variant="secondary" disabled={toggle.isPending} onClick={() => toggle.mutate({ ids: [...selected], enabled: true })}>Switch on</Button>
          <Button type="button" size="sm" variant="secondary" disabled={toggle.isPending} onClick={() => toggle.mutate({ ids: [...selected], enabled: false })}>Switch off</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <Card className={T_CARD}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allOnPage}
                    onCheckedChange={(v) => setSelected(v === true ? new Set(rows.map((r) => r.id)) : new Set())}
                    aria-label="Select all on this page"
                  />
                </TableHead>
                <TableHead className={T_HEAD_CELL}>On</TableHead>
                <TableHead className={T_HEAD_CELL}>Source</TableHead>
                <TableHead className={T_HEAD_CELL}>Level / location</TableHead>
                <TableHead className={cn(T_HEAD_CELL, "text-right")}>Posted · 30 d</TableHead>
                <TableHead className={cn(T_HEAD_CELL, "text-right")}>Dup / skip / fail</TableHead>
                <TableHead className={T_HEAD_CELL}>Last activity</TableHead>
                <TableHead className={cn(T_HEAD_CELL, "text-right")}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-6" /></TableCell></TableRow>
                  ))
                : rows.length === 0
                  ? <TableRow><TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">No sources match these filters.</TableCell></TableRow>
                  : rows.map((r) => (
                      <TableRow key={r.id} className={cn(!r.enabled && "opacity-60")}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(r.id)}
                            onCheckedChange={(v) => setSelected((s) => { const n = new Set(s); if (v === true) n.add(r.id); else n.delete(r.id); return n })}
                            aria-label={`Select ${r.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch checked={r.enabled} disabled={toggle.isPending} onCheckedChange={(v) => toggle.mutate({ ids: [r.id], enabled: v })} aria-label={`${r.name} on/off`} />
                        </TableCell>
                        <TableCell className="max-w-[320px]">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium text-foreground" title={r.name}>{r.name}</span>
                            {r.custom && <Badge variant="outline" className="shrink-0 text-[10px]">custom</Badge>}
                          </div>
                          <a href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-brick">
                            <span className="truncate">{r.id}</span> <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="font-medium text-foreground">{LEVEL_LABEL[r.level]}</span>
                          <span className="block text-xs text-muted-foreground">{[r.district, r.state].filter(Boolean).join(", ") || "All India"}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">{r.stats.posted}</TableCell>
                        <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                          {r.stats.duplicate} / {r.stats.skipped} / <span className={r.stats.failed ? "text-brick" : ""}>{r.stats.failed}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.stats.lastActivity ? formatDistanceToNow(new Date(r.stats.lastActivity), { addSuffix: true }) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button type="button" size="sm" variant="ghost" title="Check what the bot would pick up" onClick={() => check.mutate(r)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {r.custom && (
                              <>
                                <Button type="button" size="sm" variant="ghost" title="Edit" onClick={() => setDialog({ open: true, editing: r })}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  title="Delete"
                                  disabled={remove.isPending}
                                  onClick={() => { if (window.confirm(`Delete "${r.name}"? Posts it already created stay.`)) remove.mutate(r.id) }}
                                >
                                  <Trash2 className="h-4 w-4 text-brick" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t border-rule px-4 py-3 text-sm text-muted-foreground">
          <span>{list.data ? `${list.data.total} sources` : ""}</span>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="ghost" disabled={page <= 1} onClick={() => refilter(() => setPage((p) => p - 1))}>Previous</Button>
            <span className="tabular-nums">{page} / {pages}</span>
            <Button type="button" size="sm" variant="ghost" disabled={page >= pages} onClick={() => refilter(() => setPage((p) => p + 1))}>Next</Button>
          </div>
        </div>
      </Card>

      {dialog.open && (
        <SourceDialog
          key={dialog.editing?.id ?? "new"}
          editing={dialog.editing}
          states={list.data?.states ?? []}
          onClose={() => setDialog({ open: false, editing: null })}
        />
      )}

      <Dialog open={!!previewOf} onOpenChange={(o) => !o && setPreviewOf(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewOf?.row.name}</DialogTitle>
            <DialogDescription>What the bot finds on the listing page right now (before the AI step).</DialogDescription>
          </DialogHeader>
          {previewOf?.data ? <PreviewList data={previewOf.data} /> : <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Opening the page…</div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
