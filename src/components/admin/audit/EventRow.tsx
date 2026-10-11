"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import { formatDate, timeAgo } from "@/lib/utils";
import { ActionBadge } from "./ActionBadge";
import { initials } from "./types";
import type { AuditEventView, RowDensity } from "./types";
import { cn } from "@/lib/utils";

export function EventRow({
  event,
  density,
  selected,
  expanded,
  groupedCount,
  onSelect,
  onToggle,
}: {
  event: AuditEventView;
  density: RowDensity;
  selected: boolean;
  expanded: boolean;
  groupedCount?: number;
  onSelect: (v: boolean) => void;
  onToggle: () => void;
}) {
  const showDot = event.sensitive && !event.reviewedAt;
  return (
    <>
      <div
        className={cn(
          "hidden items-center gap-3 border-b border-slate-100 px-3 dark:border-white/[0.04]",
          density === "compact" ? "py-1.5" : "py-2.5",
          "md:flex",
          selected ? "bg-teal-50/60 dark:bg-teal-950/20" : "bg-white dark:bg-transparent"
        )}
      >
        <Checkbox checked={selected} onCheckedChange={(v) => onSelect(v === true)} aria-label={`Select event ${event.id}`} className="shrink-0" />
        <div className="flex w-36 shrink-0 items-center gap-1.5">
          {showDot ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-label="Needs review" /> : null}
          <ActionBadge action={event.action} count={groupedCount} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-slate-800 dark:text-slate-100">{event.summary}</p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {event.entityType} · <span className="font-mono">{event.entityId.slice(0, 8)}…</span>
          </p>
        </div>
        <div className="flex w-40 shrink-0 items-center gap-2">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-[11px] font-bold leading-none text-white" aria-hidden>
            {initials(event.actor?.name, event.actor?.email)}
          </span>
          <span className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">{event.actor?.name || event.actor?.email || "System"}</span>
        </div>
        <span
          className="w-24 shrink-0 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400"
          title={formatDate(event.createdAt, "dd MMM yyyy HH:mm:ss zzz")}
        >
          {timeAgo(event.createdAt)}
        </span>
        <button
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse event" : "Expand event"}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:hover:bg-white/5"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "")} />
        </button>
      </div>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="block w-full border-b border-slate-100 bg-white px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600 md:hidden dark:border-white/[0.04] dark:bg-transparent"
      >
        <span className="flex items-center gap-2">
          <ActionBadge action={event.action} count={groupedCount} />
          <span className="ml-auto text-[11px] tabular-nums text-slate-400">{timeAgo(event.createdAt)}</span>
        </span>
        <span className="mt-1.5 block truncate text-sm text-slate-800 dark:text-slate-100">{event.summary}</span>
        <span className="mt-0.5 block truncate text-xs text-slate-400">
          {event.entityType} · {event.actor?.name || event.actor?.email || "System"}
        </span>
      </button>
    </>
  );
}

export function DaySeparator({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-[2] border-b border-slate-200 bg-slate-50/95 px-3 py-1 backdrop-blur dark:border-white/[0.06] dark:bg-[#0b1220]/95">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}
