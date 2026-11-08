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
          "hidden items-center gap-3 border-b border-rule px-3 ",
          density === "compact" ? "py-1.5" : "py-2.5",
          "md:flex",
          selected ? "bg-paper-3 dark:bg-paper-3" : "bg-background dark:bg-transparent"
        )}
      >
        <Checkbox checked={selected} onCheckedChange={(v) => onSelect(v === true)} aria-label={`Select event ${event.id}`} className="shrink-0" />
        <div className="flex w-36 shrink-0 items-center gap-1.5">
          {showDot ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-paper-2" aria-label="Needs review" /> : null}
          <ActionBadge action={event.action} count={groupedCount} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-foreground dark:text-paper">{event.summary}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {event.entityType} · <span className="font-mono">{event.entityId.slice(0, 8)}…</span>
          </p>
        </div>
        <div className="flex w-40 shrink-0 items-center gap-2">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper-3 text-[11px] font-bold leading-none text-paper" aria-hidden>
            {initials(event.actor?.name, event.actor?.email)}
          </span>
          <span className="truncate text-xs font-medium text-muted-foreground dark:text-muted-foreground">{event.actor?.name || event.actor?.email || "System"}</span>
        </div>
        <span
          className="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground dark:text-muted-foreground"
          title={formatDate(event.createdAt, "dd MMM yyyy HH:mm:ss zzz")}
        >
          {timeAgo(event.createdAt)}
        </span>
        <button
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse event" : "Expand event"}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md leading-none text-muted-foreground hover:bg-paper-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule dark:hover:bg-background/5"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded ? "rotate-180" : "")} />
        </button>
      </div>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="block w-full border-b border-rule bg-background px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rule md:hidden  dark:bg-transparent"
      >
        <span className="flex items-center gap-2">
          <ActionBadge action={event.action} count={groupedCount} />
          <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">{timeAgo(event.createdAt)}</span>
        </span>
        <span className="mt-1.5 block truncate text-sm text-foreground dark:text-paper">{event.summary}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {event.entityType} · {event.actor?.name || event.actor?.email || "System"}
        </span>
      </button>
    </>
  );
}

export function DaySeparator({ label }: { label: string }) {
  return (
    <div className="sticky top-0 z-[2] border-b border-rule bg-paper-2/95 px-3 py-1  ">
      <span className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">{label}</span>
    </div>
  );
}
