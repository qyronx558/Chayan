"use client";
import { useState } from "react";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import type { AuditAlertRuleView } from "./types";
import { cn } from "@/lib/utils";

export function AlertRuleList({
  rules,
  onToggle,
  onCreate,
}: {
  rules: AuditAlertRuleView[];
  onToggle: (id: string, enabled: boolean) => void;
  onCreate: (r: { name: string; severity: "Critical" | "Warning"; channels: string[] }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState<"Critical" | "Warning">("Warning");
  return (
    <DataCard
      title="Alert rules"
      subtitle="Evaluated on every new event"
      action={
        <Button className="h-[30px] bg-teal-700 px-2.5 text-xs leading-none text-white hover:bg-teal-800" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> New rule
        </Button>
      }
    >
      <ul className="space-y-2">
        {rules.map((r) => (
          <li key={r.id} className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 dark:border-white/[0.06]">
            <Badge
              variant="outline"
              className={cn(
                "inline-flex h-[26px] shrink-0 items-center rounded-full border px-2 text-xs font-semibold leading-none",
                r.severity === "Critical"
                  ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
                  : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
              )}
            >
              {r.severity}
            </Badge>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{r.name}</p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{r.channels.join(" · ") || "No channels"}</p>
            </div>
            <Switch checked={r.enabled} onCheckedChange={(v) => onToggle(r.id, v)} aria-label={`Enable ${r.name}`} className="shrink-0 data-[state=checked]:bg-teal-700" />
          </li>
        ))}
        {rules.length === 0 ? <li className="py-6 text-center text-xs text-slate-400">No rules yet.</li> : null}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New alert rule</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Condition name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bulk delete of 5+ items" className="h-9" aria-label="Rule name" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">Severity</span>
              <Select value={severity} onValueChange={(v) => setSeverity(v === "Critical" ? "Critical" : "Warning")}>
                <SelectTrigger className="h-9" aria-label="Severity"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Warning">Warning</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="h-9" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                className="h-9 bg-teal-700 text-white hover:bg-teal-800"
                disabled={!name.trim()}
                onClick={() => { onCreate({ name: name.trim(), severity, channels: ["Email"] }); setName(""); setOpen(false); }}
              >
                Create rule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DataCard>
  );
}


