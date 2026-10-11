"use client";
import type { AuditDiff } from "./types";

function row(label: string, before: unknown, after: unknown) {
  const b = before === null || before === undefined ? "-" : String(before);
  const a = after === null || after === undefined ? "-" : String(after);
  if (b === a) return null;
  return (
    <div key={label} className="grid grid-cols-[120px_1fr] gap-2 border-b border-slate-100 py-1.5 text-xs last:border-0 dark:border-white/[0.06]">
      <span className="truncate font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="min-w-0 break-words leading-relaxed">
        <span className="text-red-600 line-through decoration-red-300 dark:text-red-400">{b}</span>
        <span className="mx-1.5 text-slate-300 dark:text-slate-600">→</span>
        <span className="font-medium text-emerald-700 dark:text-emerald-300">{a}</span>
      </span>
    </div>
  );
}

export function DiffView({ diff }: { diff: AuditDiff | null }) {
  if (!diff || (!diff.before && !diff.after)) {
    return <p className="text-xs text-slate-500 dark:text-slate-400">No field changes recorded.</p>;
  }
  const keys = Array.from(new Set([...Object.keys(diff.before ?? {}), ...Object.keys(diff.after ?? {})])).slice(0, 24);
  const rows = keys.map((k) => row(k, (diff.before ?? {})[k], (diff.after ?? {})[k])).filter(Boolean);
  if (rows.length === 0) return <p className="text-xs text-slate-500 dark:text-slate-400">No field changes recorded.</p>;
  return <div className="rounded-lg border border-slate-200 bg-white px-3 py-1 dark:border-white/[0.06] dark:bg-white/[0.02]">{rows}</div>;
}
