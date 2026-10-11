"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import type { AlertRuleItem } from "@/lib/analytics/types";

const METRICS = [
  { value: "error_rate", label: "Error rate %" },
  { value: "latency_p95", label: "Latency p95 (ms)" },
  { value: "bot_share", label: "Bot share %" },
  { value: "views_drop", label: "Views drop %" },
  { value: "open_issues", label: "Open issues" },
];

export function AlertRuleList({ rules, onToggle, onCreate, onDelete }: {
  rules: AlertRuleItem[];
  onToggle: (id: string, enabled: boolean, prev: boolean) => void;
  onCreate: (input: { metric: string; threshold: number; channels: Array<"Email" | "Telegram"> }) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState("error_rate");
  const [threshold, setThreshold] = useState("5");
  const [channel, setChannel] = useState<"Email" | "Telegram">("Email");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    const t = Number(threshold);
    if (!isFinite(t)) {
      toast("Enter a numeric threshold", "destructive");
      return;
    }
    setSaving(true);
    try {
      await onCreate({ metric, threshold: t, channels: [channel] });
      setOpen(false);
      setThreshold("5");
      toast("Alert rule created", "success");
    } catch {
      toast("Could not create rule", "destructive");
    } finally {
      setSaving(false);
    }
  };
  return (
    <DataCard
      title="Alert rules"
      subtitle="Scheduled evaluation sends Email or Telegram notifications"
      className="h-full"
      action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="mr-1 h-3.5 w-3.5" /> New rule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New alert rule</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <label className="block text-xs font-medium">Metric
                <Select value={metric} onValueChange={setMetric}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METRICS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </label>
              <label className="block text-xs font-medium">Threshold
                <Input className="mt-1" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
              </label>
              <label className="block text-xs font-medium">Channel
                <Select value={channel} onValueChange={(v) => setChannel(v as "Email" | "Telegram")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Telegram">Telegram</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={saving} className="bg-teal-700 hover:bg-teal-800">{saving ? "Saving…" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {rules.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No alert rules yet. Create one to get notified.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <Switch
                checked={r.enabled}
                onCheckedChange={(v) => {
                  onToggle(r.id, v, r.enabled);
                  toast(v ? "Rule enabled" : "Rule paused", "success", {
                    label: "Undo",
                    onClick: () => onToggle(r.id, r.enabled, v),
                  });
                }}
                aria-label={`Toggle ${r.metric} rule`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{METRICS.find((m) => m.value === r.metric)?.label ?? r.metric}</p>
                <p className="text-xs tabular-nums text-slate-500">Threshold {r.threshold}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {r.channels.map((c) => <Badge key={c} variant="secondary" className="text-[11px]">{c}</Badge>)}
                <Button size="sm" variant="ghost" onClick={() => onDelete(r.id)} aria-label={`Delete ${r.metric} rule`}>Remove</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DataCard>
  );
}
