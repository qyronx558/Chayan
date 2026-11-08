"use client";
import { useMemo } from "react";
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ActionBadge } from "./ActionBadge";
import { EventRow, DaySeparator } from "./EventRow";
import { EventDetail } from "./EventDetail";
import type { AuditEventView, RowDensity } from "./types";

export interface GroupedEvent {
  key: string;
  head: AuditEventView;
  children: AuditEventView[];
}

export function groupSimilar(events: AuditEventView[]): (AuditEventView | GroupedEvent)[] {
  const out: (AuditEventView | GroupedEvent)[] = [];
  let i = 0;
  while (i < events.length) {
    const head = events[i];
    if (head.action === "ROLE_CHANGE" || head.action === "UPDATE") {
      out.push(head);
      i += 1;
      continue;
    }
    const kids: AuditEventView[] = [head];
    let j = i + 1;
    while (j < events.length) {
      const next = events[j];
      const same = next.action === head.action && next.entityType === head.entityType && (next.actorId || "") === (head.actorId || "");
      const within = Math.abs(new Date(next.createdAt).getTime() - new Date(head.createdAt).getTime()) <= 10 * 60 * 1000;
      if (!same || !within || next.action === "ROLE_CHANGE" || next.action === "UPDATE") break;
      kids.push(next);
      j += 1;
    }
    if (kids.length > 1) out.push({ key: `g-${head.id}`, head, children: kids });
    else out.push(head);
    i = j;
  }
  return out;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return formatDate(iso, "EEEE, dd MMM yyyy");
}

export function EventList({
  events,
  total,
  loading,
  density,
  grouped,
  selected,
  onSelect,
  onSelectAll,
  expandedId,
  onToggle,
  isSuper,
  groupOpen,
  onGroupOpen,
  onAction,
  onClearFilters,
  liveIds,
}: {
  events: AuditEventView[];
  total: number;
  loading: boolean;
  density: RowDensity;
  grouped: boolean;
  selected: Set<string>;
  onSelect: (id: string, v: boolean) => void;
  onSelectAll: (v: boolean) => void;
  expandedId: string | null;
  onToggle: (id: string | null) => void;
  isSuper: boolean;
  groupOpen: Set<string>;
  onGroupOpen: (key: string) => void;
  onAction: (id: string, op: string, note?: string) => void;
  onClearFilters: () => void;
  liveIds: Set<string>;
}) {
  const items = useMemo(() => (grouped ? groupSimilar(events) : events), [events, grouped]);
  const groupedCount = useMemo(() => (grouped ? items.filter((x) => typeof x === "object" && "children" in x).length : 0), [items, grouped]);
  const columnHelper = useMemo(() => createColumnHelper<AuditEventView>(), []);
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: () => null,
        cell: () => null,
      }),
    ],
    [columnHelper]
  );
  const table = useReactTable({ data: events, columns, getCoreRowModel: getCoreRowModel() });
  void table;
  void flexRender;
  if (loading) {
    return (
      <div className="divide-y divide-rule100 rounded-xl border border-rule bg-background   " aria-busy>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-[26px] w-24 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-rule bg-background px-4 py-14 text-center  ">
        <p className="text-sm font-semibold text-foreground dark:text-paper">No events match</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground dark:text-muted-foreground">Try widening the date range or clearing a filter.</p>
        <Button variant="outline" className="mt-4 h-9" onClick={onClearFilters}>Clear filters</Button>
      </div>
    );
  }
  let lastDay = "";
  const allIds = events.map((e) => e.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  return (
    <div className="overflow-hidden rounded-xl border border-rule bg-background  ">
      <div className="hidden items-center gap-2 border-b border-rule px-3 py-2 md:flex ">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(v) => onSelectAll(v === true)}
          aria-label="Select all events on page"
        />
        <span className="text-xs text-muted-foreground dark:text-muted-foreground">
          Showing {events.length.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")} events
          {grouped && groupedCount > 0 ? <span> · {groupedCount} grouped</span> : null}
        </span>
      </div>
      <div className="px-3 py-2 text-xs text-muted-foreground md:hidden dark:text-muted-foreground">
        Showing {events.length.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")} events
        {grouped && groupedCount > 0 ? <span> · {groupedCount} grouped</span> : null}
      </div>
      {items.map((item) => {
        if (typeof item === "object" && "children" in item) {
          const g = item as GroupedEvent;
          const label = dayLabel(g.head.createdAt);
          const showSep = label !== lastDay;
          lastDay = label;
          const open = groupOpen.has(g.key);
          return (
            <div key={g.key}>
              {showSep ? <DaySeparator label={label} /> : null}
              <div className={liveIds.has(g.head.id) ? "bg-paper-3 transition-colors dark:bg-paper-3" : undefined}>
                <EventRow
                  event={g.head}
                  density={density}
                  selected={g.children.every((c) => selected.has(c.id))}
                  expanded={expandedId === g.head.id}
                  groupedCount={g.children.length}
                  onSelect={(v) => g.children.forEach((c) => onSelect(c.id, v))}
                  onToggle={() => onToggle(expandedId === g.head.id ? null : g.head.id)}
                />
              </div>
              <div className="border-b border-rule px-3 py-1.5 ">
                <button
                  onClick={() => onGroupOpen(g.key)}
                  aria-expanded={open}
                  className="inline-flex h-[30px] items-center rounded-full border border-rule px-3 text-xs font-medium leading-none text-brick hover:border-rule focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule  dark:text-brick"
                >
                  {open ? `Hide ${g.children.length} events` : `Expand ${g.children.length} events`}
                </button>
                {open ? (
                  <ul className="mt-1.5 space-y-1 pb-1.5">
                    {g.children.map((c) => (
                      <li key={c.id} className="flex items-center gap-2 rounded-lg bg-paper-2 px-2.5 py-1.5 text-xs dark:bg-background/[0.03]">
                        <Checkbox checked={selected.has(c.id)} onCheckedChange={(v) => onSelect(c.id, v === true)} aria-label={`Select event ${c.id}`} />
                        <span className="shrink-0 tabular-nums text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="min-w-0 flex-1 truncate text-muted-foreground dark:text-muted-foreground">{c.summary}</span>
                        <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">{c.entityId.slice(0, 8)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {expandedId === g.head.id ? (
                <EventDetail event={g.head} isSuper={isSuper} onAction={onAction} childrenEvents={g.children} />
              ) : null}
            </div>
          );
        }
        const e = item as AuditEventView;
        const label = dayLabel(e.createdAt);
        const showSep = label !== lastDay;
        lastDay = label;
        return (
          <div key={e.id}>
            {showSep ? <DaySeparator label={label} /> : null}
            <div className={liveIds.has(e.id) ? "bg-paper-3 transition-colors dark:bg-paper-3" : undefined}>
              <EventRow
                event={e}
                density={density}
                selected={selected.has(e.id)}
                expanded={expandedId === e.id}
                onSelect={(v) => onSelect(e.id, v)}
                onToggle={() => onToggle(expandedId === e.id ? null : e.id)}
              />
            </div>
            {expandedId === e.id ? <EventDetail event={e} isSuper={isSuper} onAction={onAction} /> : null}
          </div>
        );
      })}
      <div className="md:hidden">
        <ActionBadge action="CREATE" count={0} />
        <span className="hidden" />
      </div>
    </div>
  );
}
