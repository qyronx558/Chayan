"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ExternalLink, Loader2, Pause, Play, RefreshCw } from "lucide-react"
import { api, fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { T_CARD, T_PRIMARY } from "@/components/admin/list/tokens"
import type { ActivityResponse, BotSettings, RunsResponse, SettingsResponse, SourcesResponse } from "./types"
import { LEVEL_LABEL } from "./types"

const TIER_KEY = { CENTRAL: "centralEnabled", STATE: "stateEnabled", DISTRICT: "districtEnabled" } as const

function runBadge(r: { status: string; conclusion: string | null }) {
  if (r.status !== "completed") return { label: r.status === "queued" ? "Queued" : "Running", cls: "bg-paper-2 text-foreground" }
  if (r.conclusion === "success") return { label: "Success", cls: "bg-paper-3 text-foreground" }
  if (r.conclusion === "cancelled") return { label: "Cancelled", cls: "bg-paper-2 text-muted-foreground" }
  return { label: "Failed", cls: "bg-destructive/10 text-brick" }
}

export function OverviewTab({ settings }: { settings: SettingsResponse }) {
  const qc = useQueryClient()
  const s = settings.settings
  const env = settings.environment

  const totals = useQuery({
    queryKey: ["content-bot", "sources", "totals"],
    queryFn: () => fetcher<SourcesResponse>("/api/admin/content-bot/sources?page=1&q=__none__"),
  })
  const activity = useQuery({
    queryKey: ["content-bot", "activity", "summary"],
    queryFn: () => fetcher<ActivityResponse>("/api/admin/content-bot/activity?page=1"),
  })
  const runs = useQuery({
    queryKey: ["content-bot", "runs"],
    queryFn: () => fetcher<RunsResponse>("/api/admin/content-bot/run"),
    refetchInterval: (q) => (q.state.data?.runs?.some((r) => r.status !== "completed") ? 15_000 : false),
  })

  const save = useMutation({
    mutationFn: (patch: Partial<BotSettings>) => api.patch("/api/admin/content-bot/settings", patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["content-bot", "settings"] }),
    onError: (e: Error) => toast(e.message, "destructive"),
  })

  const [tier, setTier] = useState<"central" | "state" | "district" | "all">("central")
  const [source, setSource] = useState("")
  const [dryRun, setDryRun] = useState(true)
  const run = useMutation({
    mutationFn: () =>
      api.post<{ target: string }>("/api/admin/content-bot/run", { ...(source.trim() ? { source: source.trim() } : { tier }), dryRun }),
    onSuccess: (r) => {
      toast(`Run started on ${r.target}${dryRun ? " (dry run)" : ""}. It appears below within a few seconds.`, "success")
      setTimeout(() => qc.invalidateQueries({ queryKey: ["content-bot", "runs"] }), 4000)
    },
    onError: (e: Error) => toast(e.message, "destructive"),
  })

  const last = activity.data?.last24h

  return (
    <div className="space-y-4">
      {/* Master switch */}
      <Card className={cn(T_CARD, "p-5")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className={cn("mt-1 inline-flex h-3 w-3 shrink-0 rounded-full", s.enabled ? "bg-foreground" : "bg-brick")} aria-hidden />
            <div>
              <h2 className="text-lg font-semibold text-foreground">{s.enabled ? "Bot is running on schedule" : "Bot is paused"}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {s.enabled
                  ? "Central and state boards every 4 hours, district portals daily at 6:00 AM IST."
                  : "Scheduled runs are skipped. You can still start a run manually below."}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant={s.enabled ? "secondary" : "default"}
            className={s.enabled ? "" : T_PRIMARY}
            disabled={save.isPending}
            onClick={() => save.mutate({ enabled: !s.enabled })}
          >
            {s.enabled ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {s.enabled ? "Pause bot" : "Resume bot"}
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(["CENTRAL", "STATE", "DISTRICT"] as const).map((lv) => {
            const t = totals.data?.totals.find((x) => x.level === lv)
            const key = TIER_KEY[lv]
            return (
              <label key={lv} className="flex items-center justify-between gap-3 rounded-xl border border-rule p-3">
                <span>
                  <span className="block text-sm font-semibold text-foreground">{LEVEL_LABEL[lv]} sources</span>
                  <span className="block text-xs text-muted-foreground">
                    {t ? `${t.enabled} of ${t.total} switched on` : "…"}
                  </span>
                </span>
                <Switch checked={s[key]} disabled={save.isPending} onCheckedChange={(v) => save.mutate({ [key]: v })} aria-label={`${LEVEL_LABEL[lv]} tier`} />
              </label>
            )
          })}
        </div>
      </Card>

      {/* Last 24 hours */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ["Posted", last?.posted],
          ["Auto-approved", last?.autoApproved],
          ["Duplicates blocked", last?.duplicate],
          ["Skipped", last?.skipped],
          ["Failed", last?.failed],
        ].map(([label, value]) => (
          <Card key={label as string} className={cn(T_CARD, "p-4")}>
            <p className="text-xs font-medium text-muted-foreground">{label} · 24 h</p>
            {activity.isLoading ? <Skeleton className="mt-2 h-7 w-12" /> : <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value ?? 0}</p>}
          </Card>
        ))}
      </div>

      {/* Run now */}
      <Card className={cn(T_CARD, "p-5")}>
        <h2 className="text-base font-semibold text-foreground">Run now</h2>
        {!env.runNowConfigured ? (
          <div className="mt-2 space-y-2 text-sm text-muted-foreground">
            <p>
              Starting runs from here needs a GitHub token. Add <code className="rounded bg-paper-2 px-1">INGEST_GITHUB_TOKEN</code> to this
              site&apos;s environment variables (see docs/content-ingest.md → “Run now”).
            </p>
            <p>
              On your computer you can run the bot directly: <code className="rounded bg-paper-2 px-1">npm run ingest -- --tier=central</code>
            </p>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Starts the GitHub workflow for <strong>{env.runTarget}</strong>. Manual runs always go, even while the bot is paused.
            </p>
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="w-full lg:w-48">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Sources</label>
                <Select value={tier} onValueChange={(v) => setTier(v as typeof tier)} disabled={!!source.trim()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="central">Central boards</SelectItem>
                    <SelectItem value="state">State boards</SelectItem>
                    <SelectItem value="district">All districts</SelectItem>
                    <SelectItem value="all">Everything</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full lg:w-72">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">…or one source id (optional)</label>
                <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. bpsc or nic:bihar/patna" />
              </div>
              <label className="flex h-11 items-center gap-2 text-sm text-foreground">
                <Checkbox checked={dryRun} onCheckedChange={(v) => setDryRun(v === true)} /> Dry run (post nothing)
              </label>
              <Button type="button" className={T_PRIMARY} disabled={run.isPending} onClick={() => run.mutate()}>
                {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Start run
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Recent workflow runs */}
      <Card className={cn(T_CARD, "p-5")}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent runs</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => runs.refetch()} disabled={runs.isFetching}>
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", runs.isFetching && "animate-spin")} /> Refresh
          </Button>
        </div>
        {runs.data?.error && <p className="mt-2 text-sm text-brick">{runs.data.error}</p>}
        {!runs.data?.configured && !runs.isLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">GitHub run history appears here once INGEST_GITHUB_TOKEN is set. The Activity tab always shows what the bot posted.</p>
        ) : runs.isLoading ? (
          <Skeleton className="mt-3 h-24" />
        ) : runs.data?.runs.length ? (
          <ul className="mt-3 divide-y divide-rule">
            {runs.data.runs.map((r) => {
              const b = runBadge(r)
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                  <Badge variant="secondary" className={cn("border-0", b.cls)}>{b.label}</Badge>
                  <span className="text-foreground">{r.event === "schedule" ? "Scheduled" : "Manual"}</span>
                  <span className="text-muted-foreground">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</span>
                  <a href={r.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-brick hover:underline">
                    Logs <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No runs yet.</p>
        )}
      </Card>
    </div>
  )
}
