"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { BookOpen, ExternalLink, ImageIcon, Loader2, Play, Plus, Radar, Search, Sparkles, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { T_CARD, T_HEAD_CELL, T_PRIMARY } from "@/components/admin/list/tokens"
import { AddSourceDialog } from "./AddSourceDialog"
import { CatalogDialog } from "./CatalogDialog"
import { DiscoverDialog } from "./DiscoverDialog"
import { METHOD_LABEL, PROVIDER_LABEL, statsLine, type FeedRow, type FeedStats } from "./types"

const STATUS_DOT: Record<string, string> = { OK: "bg-emerald-500", HELD: "bg-amber-500", ERROR: "bg-red-500" }

export function SourcesTab({ rows, missingLogos = 0 }: { rows: FeedRow[]; missingLogos?: number }) {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [discoverOpen, setDiscoverOpen] = useState(false)
  const [running, setRunning] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const refresh = () => qc.invalidateQueries({ queryKey: ["job-feeds"] })

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return needle ? rows.filter((r) => r.company.name.toLowerCase().includes(needle) || r.boardUrl.toLowerCase().includes(needle)) : rows
  }, [rows, q])

  const toggle = useMutation({
    mutationFn: (v: { id: string; enabled?: boolean; indiaOnly?: boolean }) =>
      api.patch(`/api/admin/private-feeds/${v.id}`, { enabled: v.enabled, indiaOnly: v.indiaOnly }),
    onSuccess: refresh,
    onError: (e: Error) => toast(e.message, "destructive"),
  })

  const run = useMutation({
    mutationFn: (v: { id: string; force?: boolean }) =>
      api.post<{ data: { status: string; message: string | null; stats: FeedStats } }>(
        `/api/admin/private-feeds/${v.id}${v.force ? "?force=1" : ""}`
      ),
    onMutate: (v) => setRunning(v.id),
    onSuccess: ({ data: r }) => {
      toast(r.status === "OK" ? `Synced: ${statsLine(r.stats)}` : r.message || "Sync finished with a warning", r.status === "OK" ? "success" : "destructive")
      refresh()
    },
    onError: (e: Error) => toast(e.message, "destructive"),
    onSettled: () => setRunning(null),
  })

  const logos = useMutation({
    mutationFn: () => api.post<{ checked: number; found: number }>("/api/admin/private-feeds/logos", {}),
    onSuccess: (r) => {
      toast(r.checked ? `Found ${r.found} logos for ${r.checked} companies.` : "Every hiring company already has a logo (or was checked recently).", "success")
      refresh()
    },
    onError: (e: Error) => toast(e.message, "destructive"),
  })

  const remove = useMutation({
    mutationFn: (v: { id: string; closeJobs: boolean }) =>
      api.delete<{ closed: number }>(`/api/admin/private-feeds/${v.id}${v.closeJobs ? "?closeJobs=1" : ""}`),
    onSuccess: (res) => {
      toast(res.closed ? `Source removed and ${res.closed} live jobs closed.` : "Source removed.", "success")
      refresh()
    },
    onError: (e: Error) => toast(e.message, "destructive"),
  })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies" className="pl-9" aria-label="Search sources" />
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => logos.mutate()} disabled={logos.isPending} title="Fetch real logos from job boards, company websites and Wikidata">
            {logos.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-1.5 h-4 w-4" />}
            {logos.isPending ? "Finding logos…" : `Find logos${missingLogos ? ` (${missingLogos})` : ""}`}
          </Button>
          <Button variant="outline" onClick={() => setDiscoverOpen(true)} title="Find job boards from company names">
            <Radar className="mr-1.5 h-4 w-4" /> Discover
          </Button>
          <Button variant="outline" onClick={() => setCatalogOpen(true)}>
            <BookOpen className="mr-1.5 h-4 w-4" /> Catalog
          </Button>
          <Button className={T_PRIMARY} onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add source
          </Button>
        </div>
      </div>

      <Card className={T_CARD}>
        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">No sources yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Start with the catalog of well-known employers, or add any company&apos;s careers page - Gemini reads it when there is
              no job board.
            </p>
            <Button className={cn(T_PRIMARY, "mt-4")} onClick={() => setCatalogOpen(true)}>
              <BookOpen className="mr-1.5 h-4 w-4" /> Open catalog
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={T_HEAD_CELL}>Company</TableHead>
                  <TableHead className={T_HEAD_CELL}>Last sync</TableHead>
                  <TableHead className={cn(T_HEAD_CELL, "text-right")}>Live / closed</TableHead>
                  <TableHead className={T_HEAD_CELL}>India only</TableHead>
                  <TableHead className={T_HEAD_CELL}>On</TableHead>
                  <TableHead className={cn(T_HEAD_CELL, "text-right")}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="min-w-[180px]">
                      <div className="font-medium">{f.company.name}</div>
                      <a
                        href={f.boardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-[260px] items-center gap-1 truncate text-xs text-muted-foreground hover:underline"
                      >
                        {f.provider === "CAREER_PAGE" && <Sparkles className="h-3 w-3 shrink-0" />}
                        {PROVIDER_LABEL[f.provider]} · <span className="truncate">{f.provider === "CAREER_PAGE" ? f.pageUrl : f.boardToken}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell className="min-w-[220px] max-w-sm">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", f.lastStatus ? STATUS_DOT[f.lastStatus] : "bg-muted-foreground/40")} />
                        {f.lastRunAt ? formatDistanceToNow(new Date(f.lastRunAt), { addSuffix: true }) : "Never"}
                        {f.lastStats?.method && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{METHOD_LABEL[f.lastStats.method] ?? f.lastStats.method}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{statsLine(f.lastStats)}</p>
                      {f.lastError && (
                        <p className={cn("mt-0.5 break-words text-xs", f.lastStatus === "OK" ? "text-muted-foreground" : "text-red-600")}>{f.lastError}</p>
                      )}
                      {f.lastStatus === "HELD" && (
                        <button
                          type="button"
                          className="mt-1 text-xs font-semibold text-amber-700 underline-offset-2 hover:underline disabled:opacity-50"
                          disabled={running !== null}
                          onClick={() => {
                            if (window.confirm("Checked the source and the jobs really are gone? Missing jobs will be counted and close after two runs.")) {
                              run.mutate({ id: f.id, force: true })
                            }
                          }}
                        >
                          Confirm removals &amp; sync
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {f.jobs.active} <span className="text-muted-foreground">/ {f.jobs.expired}</span>
                    </TableCell>
                    <TableCell>
                      <Switch checked={f.indiaOnly} onCheckedChange={(v) => toggle.mutate({ id: f.id, indiaOnly: v })} aria-label="India only" />
                    </TableCell>
                    <TableCell>
                      <Switch checked={f.enabled} onCheckedChange={(v) => toggle.mutate({ id: f.id, enabled: v })} aria-label="Enabled" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" disabled={running !== null} onClick={() => run.mutate({ id: f.id })} aria-label={`Sync ${f.company.name} now`}>
                          {running === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Remove ${f.company.name}`}
                          onClick={() => {
                            if (!window.confirm(`Remove the ${f.company.name} source?`)) return
                            const closeJobs = f.jobs.active > 0 && window.confirm(`Also close its ${f.jobs.active} live jobs now? (Cancel keeps them until they expire.)`)
                            remove.mutate({ id: f.id, closeJobs })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No source matches “{q}”.</p>}
          </div>
        )}
      </Card>

      <AddSourceDialog open={adding} onOpenChange={setAdding} />
      <CatalogDialog open={catalogOpen} onOpenChange={setCatalogOpen} />
      <DiscoverDialog open={discoverOpen} onOpenChange={setDiscoverOpen} />
    </div>
  )
}
