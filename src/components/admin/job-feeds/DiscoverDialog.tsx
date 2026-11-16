"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Radar, RotateCcw } from "lucide-react"
import { api, fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import { T_PRIMARY } from "@/components/admin/list/tokens"
import { PROVIDER_LABEL, type DiscoveryResponse, type Provider } from "./types"

const STATUS_STYLE: Record<string, string> = {
  FOUND: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  NOT_FOUND: "bg-muted text-muted-foreground",
  ERROR: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
}
const STATUS_LABEL: Record<string, string> = { FOUND: "Found", PENDING: "Queued", NOT_FOUND: "No board", ERROR: "Error" }

interface RunResponse {
  queued: number
  skipped: number
  run: { checked: number; found: number; added: number } | null
}

/**
 * Paste company names → each one is looked up on Greenhouse, Lever, Ashby,
 * SmartRecruiters, Workable, Recruitee, Personio and Breezy (and on its website
 * when given). Boards that exist become feeds; the rest of the queue is worked
 * through by the cron.
 */
export function DiscoverDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient()
  const [names, setNames] = useState("")
  const [indiaOnly, setIndiaOnly] = useState(false)
  const queue = useQuery({
    queryKey: ["job-feeds", "discover"],
    queryFn: () => fetcher<DiscoveryResponse>("/api/admin/private-feeds/discover"),
    enabled: open,
  })
  const counts = queue.data?.counts
  const lineCount = names.split(/\r?\n/).filter((l) => l.trim()).length

  const submit = useMutation({
    mutationFn: (body: { names?: string; indiaOnly?: boolean; run?: boolean; retry?: boolean }) =>
      api.post<RunResponse>("/api/admin/private-feeds/discover", body),
    onSuccess: (res) => {
      const parts = [
        res.queued ? `${res.queued} queued` : null,
        res.skipped ? `${res.skipped} already in the queue` : null,
        res.run ? `${res.run.checked} checked, ${res.run.added} boards added` : null,
      ].filter(Boolean)
      toast(parts.join(" · ") || "Nothing to do", "success")
      setNames("")
      qc.invalidateQueries({ queryKey: ["job-feeds"] })
    },
    onError: (e: Error) => toast(e.message, "destructive"),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Discover job boards</DialogTitle>
          <DialogDescription>
            Paste company names, one per line (optionally <code className="text-xs">Name | website</code>). Each company is checked
            on 8 job-board platforms; boards that exist are added and synced automatically.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={names}
          onChange={(e) => setNames(e.target.value)}
          rows={6}
          placeholder={"Spotify\nShopify | shopify.com\nZepto"}
          aria-label="Company names"
          className="font-mono text-sm"
        />
        <label className="flex items-center justify-between gap-3 rounded-xl border border-rule px-3 py-2.5 text-sm">
          <span>
            <span className="font-medium">India &amp; remote only</span>
            <span className="block text-xs text-muted-foreground">Off: import openings from every country.</span>
          </span>
          <Switch checked={indiaOnly} onCheckedChange={setIndiaOnly} />
        </label>

        {counts && (
          <div className="grid grid-cols-4 gap-2 text-center">
            {(["PENDING", "FOUND", "NOT_FOUND", "ERROR"] as const).map((k) => (
              <div key={k} className="rounded-xl border border-rule px-2 py-2">
                <div className="text-lg font-bold tabular-nums">{counts[k].toLocaleString("en-IN")}</div>
                <div className="text-[11px] text-muted-foreground">{STATUS_LABEL[k]}</div>
              </div>
            ))}
          </div>
        )}

        <div className="-mx-6 max-h-[28vh] overflow-y-auto px-6">
          {queue.data?.data.length ? (
            <ul className="divide-y divide-rule text-sm">
              {queue.data.data.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2">
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_STYLE[c.status])}>{STATUS_LABEL[c.status] ?? c.status}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.provider ? `${PROVIDER_LABEL[c.provider as Provider] ?? c.provider} · ${c.jobs ?? 0} roles` : c.checkedAt ? formatDistanceToNow(new Date(c.checkedAt), { addSuffix: true }) : "waiting"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">{queue.isLoading ? "Loading…" : "The queue is empty."}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            disabled={submit.isPending || !(counts && counts.NOT_FOUND + counts.ERROR)}
            onClick={() => submit.mutate({ retry: true })}
            title="Put companies without a board back in the queue"
          >
            <RotateCcw className="mr-1.5 h-4 w-4" /> Retry misses
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" disabled={submit.isPending || (!lineCount && !counts?.PENDING)} onClick={() => submit.mutate({ names, indiaOnly, run: false })}>
              Queue for cron
            </Button>
            <Button className={T_PRIMARY} disabled={submit.isPending || (!lineCount && !counts?.PENDING)} onClick={() => submit.mutate({ names, indiaOnly, run: true })}>
              {submit.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Radar className="mr-1.5 h-4 w-4" />}
              {submit.isPending ? "Searching boards…" : lineCount ? `Find ${lineCount} now` : "Run queue now"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
