"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save } from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { T_CARD, T_PRIMARY } from "@/components/admin/list/tokens"
import type { BotSettings, SettingsResponse } from "./types"

type Form = {
  autoApprove: boolean
  autoApproveDailyCap: string
  minScore: string
  minConfidence: string
  maxNewPerSource: string
  maxLlmCalls: string
  geminiModel: string
}

const toForm = (s: BotSettings): Form => ({
  autoApprove: s.autoApprove,
  autoApproveDailyCap: String(s.autoApproveDailyCap),
  minScore: String(s.minScore),
  minConfidence: String(Math.round(s.minConfidence * 100)),
  maxNewPerSource: String(s.maxNewPerSource),
  maxLlmCalls: String(s.maxLlmCalls),
  geminiModel: s.geminiModel ?? "",
})

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[1fr_200px] sm:items-center sm:gap-6">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  )
}

export function SettingsTab({ settings }: { settings: SettingsResponse }) {
  const qc = useQueryClient()
  // The page re-mounts this tab (key) whenever saved settings change, so the form starts fresh.
  const [form, setForm] = useState<Form>(() => toForm(settings.settings))
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = useMutation({
    mutationFn: () => {
      const int = (v: string, name: string) => {
        const n = Number(v)
        if (!Number.isInteger(n)) throw new Error(`${name} must be a whole number`)
        return n
      }
      return api.patch("/api/admin/content-bot/settings", {
        autoApprove: form.autoApprove,
        autoApproveDailyCap: int(form.autoApproveDailyCap, "Daily cap"),
        minScore: int(form.minScore, "Minimum quality score"),
        minConfidence: int(form.minConfidence, "Minimum confidence") / 100,
        maxNewPerSource: int(form.maxNewPerSource, "New notices per source"),
        maxLlmCalls: int(form.maxLlmCalls, "AI calls per run"),
        geminiModel: form.geminiModel.trim() || null,
      })
    },
    onSuccess: () => {
      toast("Settings saved - the next run uses them.", "success")
      qc.invalidateQueries({ queryKey: ["content-bot", "settings"] })
    },
    onError: (e: Error) => toast(e.message, "destructive"),
  })

  const env = settings.environment
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
    >
      {!settings.settings.saved && (
        <p className="rounded-xl border border-rule bg-paper-2 px-4 py-3 text-sm text-foreground">
          Nothing saved yet - the bot uses the values from the environment (.env / Vercel). Saving here overrides them.
        </p>
      )}

      <Card className={cn(T_CARD, "space-y-5 p-5")}>
        <div>
          <h2 className="text-base font-semibold text-foreground">Publishing</h2>
          <p className="text-sm text-muted-foreground">Off = every bot post waits in Content verification for a human. Recommended until you have reviewed a few hundred posts.</p>
        </div>
        <Field label="Auto-approve clean posts" hint="Only posts with no warnings, a high score and verified facts are published automatically.">
          <Switch checked={form.autoApprove} onCheckedChange={(v) => set("autoApprove", v)} aria-label="Auto-approve" />
        </Field>
        <Field label="Daily auto-approve cap" hint="Maximum posts published automatically per day (IST). Keeps growth steady for Google.">
          <Input type="number" min={0} max={1000} value={form.autoApproveDailyCap} onChange={(e) => set("autoApproveDailyCap", e.target.value)} disabled={!form.autoApprove} />
        </Field>
        <Field label="Minimum quality score (0-100)" hint="Score from facts found, original overview and verification.">
          <Input type="number" min={0} max={100} value={form.minScore} onChange={(e) => set("minScore", e.target.value)} disabled={!form.autoApprove} />
        </Field>
        <Field label="Minimum confidence (%)" hint="How sure the checks are that every fact matches the notice.">
          <Input type="number" min={0} max={100} value={form.minConfidence} onChange={(e) => set("minConfidence", e.target.value)} disabled={!form.autoApprove} />
        </Field>
      </Card>

      <Card className={cn(T_CARD, "space-y-5 p-5")}>
        <div>
          <h2 className="text-base font-semibold text-foreground">Limits</h2>
          <p className="text-sm text-muted-foreground">Keep these within the free Gemini quota. Each district part and each central/state run gets its own budget.</p>
        </div>
        <Field label="New notices per source per run" hint="Newest first; the rest are picked up next run.">
          <Input type="number" min={1} max={100} value={form.maxNewPerSource} onChange={(e) => set("maxNewPerSource", e.target.value)} />
        </Field>
        <Field label="AI calls per run" hint="Hard stop for one run part (about 5 s per call).">
          <Input type="number" min={1} max={1000} value={form.maxLlmCalls} onChange={(e) => set("maxLlmCalls", e.target.value)} />
        </Field>
      </Card>

      <Card className={cn(T_CARD, "space-y-5 p-5")}>
        <div>
          <h2 className="text-base font-semibold text-foreground">AI model</h2>
          <p className="text-sm text-muted-foreground">
            Leave blank to use <code className="rounded bg-paper-2 px-1">GEMINI_MODEL</code> from the environment, or the built-in default{" "}
            <code className="rounded bg-paper-2 px-1">{env.defaultModel}</code>. A retired model falls back to the default automatically.
          </p>
        </div>
        <Field label="Gemini model id" hint="Exact id from Google AI Studio, e.g. gemini-3.5-flash-lite.">
          <Input value={form.geminiModel} onChange={(e) => set("geminiModel", e.target.value)} placeholder={env.defaultModel} spellCheck={false} />
        </Field>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className={T_PRIMARY} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save settings
        </Button>
      </div>
    </form>
  )
}
