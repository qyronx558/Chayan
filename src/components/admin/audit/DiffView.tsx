"use client";
import type { AuditDiff } from "./types";

function row(label: string, before: unknown, after: unknown) {
  const b = before === null || before === undefined ? "-" : String(before);
  const a = after === null || after === undefined ? "-" : String(after);
  if (b === a) return null;
  return (
    <div key={label} className="grid grid-cols-[120px_1fr] gap-2 border-b border-rule py-1.5 text-xs last:border-0 ">
      <span className="truncate font-medium text-muted-foreground dark:text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words leading-relaxed">
        <span className="text-brick line-through decoration-red-300 dark:text-brick">{b}</span>
        <span className="mx-1.5 text-muted-foreground dark:text-muted-foreground">→</span>
        <span className="font-medium text-foreground dark:text-foreground">{a}</span>
      </span>
    </div>
  );
}

export function DiffView({ diff }: { diff: AuditDiff | null }) {
  if (!diff || (!diff.before && !diff.after)) {
    return <p className="text-xs text-muted-foreground dark:text-muted-foreground">No field changes recorded.</p>;
  }
  const keys = Array.from(new Set([...Object.keys(diff.before ?? {}), ...Object.keys(diff.after ?? {})])).slice(0, 24);
  const rows = keys.map((k) => row(k, (diff.before ?? {})[k], (diff.after ?? {})[k])).filter(Boolean);
  if (rows.length === 0) return <p className="text-xs text-muted-foreground dark:text-muted-foreground">No field changes recorded.</p>;
  return <div className="rounded-lg border border-rule bg-background px-3 py-1  dark:bg-background/[0.02]">{rows}</div>;
}
