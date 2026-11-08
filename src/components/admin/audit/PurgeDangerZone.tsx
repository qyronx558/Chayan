"use client";
import { useState } from "react";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TriangleAlert } from "lucide-react";

export function PurgeDangerZone({
  legalHold,
  onCount,
  onPurge,
  working,
}: {
  legalHold: boolean;
  onCount: (days: number) => Promise<number>;
  onPurge: (days: number) => Promise<void>;
  working: boolean;
}) {
  const [days, setDays] = useState(30);
  const [affected, setAffected] = useState<number | null>(null);
  const [confirm, setConfirm] = useState("");
  async function refresh(d: number) {
    setDays(d);
    setAffected(await onCount(d).catch(() => null));
  }
  return (
    <DataCard title="Danger zone" subtitle="Permanently delete old events. This writes a LOG_PURGE event.">
      <div className="flex items-start gap-2 rounded-lg border border-brick bg-paper-2 p-2.5 text-xs text-brick dark:border-brick dark:bg-paper-2 dark:text-brick">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>{legalHold ? "Legal hold is ON. All deletion is blocked until it is lifted." : "Deletion is permanent. An archive copy is created first when enabled."}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Older than">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => refresh(d)}
            aria-pressed={days === d}
            className={`inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule ${days === d ? "border-rule bg-paper-3 text-paper" : "border-rule bg-background text-muted-foreground  dark:bg-transparent dark:text-muted-foreground"}`}
          >
            Older than {d}d
          </button>
        ))}
        <span className="inline-flex h-9 items-center text-xs tabular-nums text-muted-foreground dark:text-muted-foreground">
          {affected === null ? "Select a range to count" : `${affected.toLocaleString("en-IN")} events affected`}
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder='Type DELETE to confirm'
          className="h-9 flex-1"
          aria-label="Type DELETE to confirm purge"
          disabled={legalHold}
        />
        <Button
          variant="destructive"
          className="h-9"
          disabled={working || legalHold || confirm !== "DELETE"}
          onClick={async () => { await onPurge(days); setConfirm(""); setAffected(null); }}
        >
          {working ? "Purging…" : "Delete events"}
        </Button>
      </div>
    </DataCard>
  );
}
