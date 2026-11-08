"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { SlidersHorizontal } from "lucide-react";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "./types";
import type { AuditFilters, RowDensity } from "./types";

export function FilterPanel({
  filters,
  onChange,
  showActor,
  resultCount,
  onClose,
}: {
  filters: AuditFilters;
  onChange: (f: AuditFilters) => void;
  showActor: boolean;
  resultCount: number;
  onClose: () => void;
}) {
  return (
    <div className="rounded-lg border border-rule bg-paper-2 p-3  dark:bg-background/[0.02]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-medium text-muted-foreground dark:text-muted-foreground">Action</span>
          <Select value={filters.action || "all"} onValueChange={(v) => onChange({ ...filters, action: v === "all" ? "" : v })}>
            <SelectTrigger className="h-9 w-full bg-background " aria-label="Filter by action">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {AUDIT_ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="block min-w-0">
          <span className="mb-1 block text-xs font-medium text-muted-foreground dark:text-muted-foreground">Entity</span>
          <Select value={filters.entity || "all"} onValueChange={(v) => onChange({ ...filters, entity: v === "all" ? "" : v })}>
            <SelectTrigger className="h-9 w-full bg-background " aria-label="Filter by entity">
              <SelectValue placeholder="All sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {AUDIT_ENTITIES.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        {showActor ? (
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-medium text-muted-foreground dark:text-muted-foreground">Actor</span>
            <Input
              value={filters.actor}
              onChange={(e) => onChange({ ...filters, actor: e.target.value })}
              placeholder="Actor user ID"
              className="h-9 bg-background font-mono text-xs "
              aria-label="Filter by actor ID"
            />
          </label>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-medium text-muted-foreground dark:text-muted-foreground">From</span>
            <Input type="date" value={filters.from} onChange={(e) => onChange({ ...filters, from: e.target.value })} className="h-9 bg-background " aria-label="From date" />
          </label>
          <label className="block min-w-0">
            <span className="mb-1 block text-xs font-medium text-muted-foreground dark:text-muted-foreground">To</span>
            <Input type="date" value={filters.to} onChange={(e) => onChange({ ...filters, to: e.target.value })} className="h-9 bg-background " aria-label="To date" />
          </label>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          className="h-9 px-3 text-sm"
          onClick={() => onChange({ q: filters.q, action: "", entity: "", actor: "", from: "", to: "", view: filters.view })}
        >
          Clear filters
        </Button>
        <Button className="h-9 bg-paper-3 px-4 text-sm text-paper hover:bg-paper-3" onClick={onClose}>
          Show {resultCount.toLocaleString("en-IN")} results
        </Button>
      </div>
    </div>
  );
}

export function DisplayPopover({
  density,
  onDensity,
  grouped,
  onGrouped,
}: {
  density: RowDensity;
  onDensity: (d: RowDensity) => void;
  grouped: boolean;
  onGrouped: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 border-rule bg-background  "
          aria-label="Display options"
          aria-expanded={open}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 border-rule bg-background  " align="end">
        <p className="text-sm font-semibold text-foreground dark:text-paper">Row density</p>
        <p className="mt-0.5 text-xs text-muted-foreground dark:text-muted-foreground">Comfy breathes, compact fits more rows.</p>
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg border border-rule p-1 " role="group" aria-label="Row density">
          {(["comfy", "compact"] as RowDensity[]).map((d) => (
            <button
              key={d}
              onClick={() => onDensity(d)}
              aria-pressed={density === d}
              className={`inline-flex h-9 items-center justify-center rounded-md text-sm font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule ${
                density === d ? "bg-paper-3 text-paper" : "text-muted-foreground hover:bg-paper-3 dark:text-muted-foreground dark:hover:bg-background/5"
              }`}
            >
              {d === "comfy" ? "Comfy" : "Compact"}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground dark:text-paper">Group similar events</p>
            <p className="mt-0.5 text-xs text-muted-foreground dark:text-muted-foreground">Merge repeats within 10 minutes.</p>
          </div>
          <Switch checked={grouped} onCheckedChange={onGrouped} aria-label="Group similar events" className="shrink-0 data-[state=checked]:bg-paper-3" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
