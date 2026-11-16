"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Loader2, Save, XCircle } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { T_CARD, T_PRIMARY } from "@/components/admin/list/tokens"
import type { SettingsResponse } from "./types"

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="shrink-0 sm:w-44 sm:text-right">{children}</div>
    </div>
  )
}

function EnvLine({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
      <span>
        <span className="font-medium">{label}</span>
        {!ok && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </li>
  )
}

export function SettingsTab({ data }: { data: SettingsResponse }) {
  const qc = useQueryClient()
  const s = data.settings
  const [form, setForm] = useState({
    enabled: s.enabled,
    intervalHours: String(s.intervalHours),
    autoPublishAi: s.autoPublishAi,
    minConfidence: String(Math.round(s.minConfidence * 100)),
    maxAiPagesPerRun: String(s.maxAiPagesPerRun),
    geminiModel: s.geminiModel ?? "",
  })
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = useMutation({
    mutationFn: () =>
      api.patch("/api/admin/private-feeds/settings", {
        enabled: form.enabled,
        intervalHours: Number(form.intervalHours),
        autoPublishAi: form.autoPublishAi,
        minConfidence: Number(form.minConfidence) / 100,
        maxAiPagesPerRun: Number(form.maxAiPagesPerRun),
        geminiModel: form.geminiModel.trim() || null,
      }),
    onSuccess: () => {
      toast("Settings saved - they apply from the next run.", "success")
      qc.invalidateQueries({ queryKey: ["job-feeds"] })
    },
    onError: (e: Error) => toast(e.message, "destructive"),
  })

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className={`${T_CARD} px-5`}>
        <div className="divide-y divide-rule">
          <Row label="Automatic seeding" hint="Master switch. Off pauses every scheduled sync; manual “Sync now” still works.">
            <Switch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} aria-label="Automatic seeding" />
          </Row>
          <Row label="Re-sync every (hours)" hint="How fresh listings are. 1-3 h for maximum freshness, 6 h is a good default.">
            <Input type="number" min={1} max={72} value={form.intervalHours} onChange={(e) => set("intervalHours", e.target.value)} />
          </Row>
          <Row
            label="Publish AI-extracted jobs automatically"
            hint="Off: jobs Gemini reads from careers pages wait in Content verification. Board and structured-data jobs always publish."
          >
            <Switch checked={form.autoPublishAi} onCheckedChange={(v) => set("autoPublishAi", v)} aria-label="Auto-publish AI jobs" />
          </Row>
          <Row label="Minimum AI confidence (%)" hint="Below this, AI jobs always go to review even when auto-publish is on.">
            <Input
              type="number"
              min={50}
              max={100}
              value={form.minConfidence}
              disabled={!form.autoPublishAi}
              onChange={(e) => set("minConfidence", e.target.value)}
            />
          </Row>
          <Row label="Careers pages read with AI per call" hint="Each costs one Gemini request; unchanged pages never call Gemini. 0 disables AI reading.">
            <Input type="number" min={0} max={10} value={form.maxAiPagesPerRun} onChange={(e) => set("maxAiPagesPerRun", e.target.value)} />
          </Row>
          <Row label="Gemini model" hint={`Blank uses ${data.environment.effectiveModel}.`}>
            <Input value={form.geminiModel} placeholder="default" onChange={(e) => set("geminiModel", e.target.value)} />
          </Row>
        </div>
        <div className="flex justify-end border-t border-rule py-4">
          <Button className={T_PRIMARY} onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Save settings
          </Button>
        </div>
      </Card>

      <Card className={`${T_CARD} h-fit p-5`}>
        <h3 className="text-sm font-semibold">Environment</h3>
        <ul className="mt-3 space-y-2.5">
          <EnvLine ok={data.environment.geminiConfigured} label="Gemini API key" hint="Add GEMINI_API_KEY to the site's environment to read careers pages with AI." />
          <EnvLine ok={data.environment.cronConfigured} label="Cron secret" hint="Add CRON_SECRET so the scheduler can call /api/cron/private-feeds." />
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Schedule <code className="rounded bg-muted px-1">GET /api/cron/private-feeds</code> every 30 minutes with the cron secret. Each
          call syncs the sources that are due.
        </p>
      </Card>
    </div>
  )
}
