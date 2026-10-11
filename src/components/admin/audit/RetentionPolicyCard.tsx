"use client";
import { useState } from "react";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck } from "lucide-react";
import type { ExportScheduleState, IntegrityState, RetentionState } from "./types";

export function RetentionPolicyCard({
  policy,
  onSave,
  saving,
}: {
  policy: RetentionState;
  onSave: (p: { keepDays: number | null; archiveBeforeDelete: boolean; legalHold: boolean }) => void;
  saving: boolean;
}) {
  const [keep, setKeep] = useState<string>(policy.keepDays === null ? "forever" : String(policy.keepDays));
  const [archive, setArchive] = useState(policy.archiveBeforeDelete);
  const [hold, setHold] = useState(policy.legalHold);
  const pct = Math.min(100, Math.round((policy.storageUsedMb / Math.max(1, policy.storageQuotaMb)) * 100));
  return (
    <DataCard title="Retention policy" subtitle="How long audit events are kept">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Keep logs for</span>
          <Select value={keep} onValueChange={setKeep}>
            <SelectTrigger className="h-9 w-full" aria-label="Retention period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
              <SelectItem value="forever">Forever</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <div className="flex items-end pb-1">
          <Button
            className="h-9 bg-teal-700 text-white hover:bg-teal-800"
            disabled={saving}
            onClick={() => onSave({ keepDays: keep === "forever" ? null : parseInt(keep, 10), archiveBeforeDelete: archive, legalHold: hold })}
          >
            {saving ? "Saving…" : "Save policy"}
          </Button>
        </div>
      </div>
      <div className="mt-3 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Archive before deleting</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Keep a compressed CSV.GZ copy first.</p>
          </div>
          <Switch checked={archive} onCheckedChange={setArchive} aria-label="Archive before deleting" className="shrink-0 data-[state=checked]:bg-teal-700" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Legal hold</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Blocks all deletion while on.</p>
          </div>
          <Switch checked={hold} onCheckedChange={setHold} aria-label="Legal hold" className="shrink-0 data-[state=checked]:bg-teal-700" />
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Storage used</span>
          <span className="tabular-nums">{policy.storageUsedMb} / {policy.storageQuotaMb} MB</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-teal-600" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </DataCard>
  );
}

export function ScheduleCard({
  schedule,
  onSave,
  saving,
}: {
  schedule: ExportScheduleState;
  onSave: (s: ExportScheduleState) => void;
  saving: boolean;
}) {
  const [enabled, setEnabled] = useState(schedule.enabled);
  const [format, setFormat] = useState<"CSV" | "JSON">(schedule.format);
  const [recipients, setRecipients] = useState(schedule.recipients.join(", "));
  return (
    <DataCard title="Scheduled export" subtitle="Weekly off-site copy of the audit trail">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Weekly export</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Runs every Monday at 02:00 UTC.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Weekly export" className="shrink-0 data-[state=checked]:bg-teal-700" />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Format</span>
          <Select value={format} onValueChange={(v) => setFormat(v === "JSON" ? "JSON" : "CSV")}>
            <SelectTrigger className="h-9 w-full" aria-label="Export format"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CSV">CSV</SelectItem>
              <SelectItem value="JSON">JSON</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Recipients</span>
          <Input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="a@x.in, b@x.in" className="h-9" aria-label="Export recipients" />
        </label>
      </div>
      <Button
        className="mt-3 h-9 bg-teal-700 text-white hover:bg-teal-800"
        disabled={saving}
        onClick={() => onSave({ enabled, frequency: "WEEKLY", format, recipients: recipients.split(",").map((s) => s.trim()).filter((s) => s.includes("@")) })}
      >
        {saving ? "Saving…" : "Save schedule"}
      </Button>
    </DataCard>
  );
}

export function IntegrityCard({ state, onVerify, verifying }: { state: IntegrityState | null; onVerify: () => void; verifying: boolean }) {
  return (
    <DataCard title="Integrity" subtitle="Tamper-evident hash chain">
      <div className="flex items-center gap-2">
        <ShieldCheck className={`h-5 w-5 ${state?.ok === false ? "text-red-600" : "text-emerald-600"}`} aria-hidden />
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{state?.ok === false ? "Mismatch found" : "Chain intact"}</p>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {state?.checked.toLocaleString("en-IN") ?? 0} events checked
        {state?.lastVerifiedAt ? ` · last verified ${new Date(state.lastVerifiedAt).toLocaleString("en-IN")}` : ""}
        {state?.firstMismatchId ? ` · first mismatch ${state.firstMismatchId.slice(0, 8)}` : ""}
      </p>
      <Button variant="outline" className="mt-3 h-9" disabled={verifying} onClick={onVerify}>
        {verifying ? "Verifying…" : "Verify now"}
      </Button>
    </DataCard>
  );
}
