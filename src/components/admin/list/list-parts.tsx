"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DensityToggle } from "@/components/admin/data-table/DensityToggle";
import { AuditTimeline } from "@/components/admin/AuditTimeline";
import { LIST_TABS, type ListTab } from "@/lib/admin/access";
import type { Density } from "@/lib/admin/usePageSize";
import type { FilterDef, ListCounts, LookupOption } from "./types";
import { cn } from "@/lib/utils";
import {
  Search,
  SlidersHorizontal,
  X,
  CheckCircle2,
  XCircle,
  Trash2,
  Send,
  Download,
  History,
} from "lucide-react";

export function StatusTabs({
  counts,
  active,
  onChange,
}: {
  counts: ListCounts | undefined;
  active: ListTab;
  onChange: (tab: ListTab) => void;
}) {
  const value = (key: ListTab): number | undefined => {
    if (!counts) return undefined;
    if (key === "all") return counts.all;
    if (key === "published") return counts.published;
    if (key === "needs") return counts.needsReview;
    if (key === "draft") return counts.draft;
    return counts.rejected;
  };
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Status filter">
      {LIST_TABS.map((t) => {
        const n = value(t.key);
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
              isActive
                ? "border-teal-700 bg-teal-700 text-white shadow-sm dark:border-teal-600 dark:bg-teal-600"
                : "border-slate-200 bg-white text-slate-600 hover:border-teal-600/40 hover:text-teal-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300 dark:hover:text-teal-300"
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-px text-[11px] font-bold tabular-nums",
                isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400"
              )}
            >
              {n ?? "…"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export interface ToolbarFilters {
  defs: FilterDef[];
  values: Record<string, string>;
  lookups: Record<string, LookupOption[]>;
  showUploader: boolean;
  uploaderOptions: LookupOption[];
  uploader: string;
}

export function ListToolbar({
  q,
  onQ,
  searchRef,
  placeholder,
  filters,
  onFilter,
  onUploader,
  onClearFilters,
  activeFilterCount,
  density,
  onDensity,
}: {
  q: string;
  onQ: (v: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  placeholder: string;
  filters: ToolbarFilters;
  onFilter: (key: string, value: string) => void;
  onUploader: (value: string) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  density: Density;
  onDensity: (d: Density) => void;
}) {
  const [popOpen, setPopOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-52 flex-1">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          ref={searchRef}
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder={placeholder}
          className="bg-white pl-8 pr-10 dark:bg-white/[0.03]"
          aria-label="Search"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-slate-400 sm:block dark:border-white/10 dark:bg-white/[0.05]">
          /
        </kbd>
      </div>
      <Popover open={popOpen} onOpenChange={setPopOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="relative">
            <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" /> Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-700 px-1 text-[11px] font-bold text-white dark:bg-teal-600">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-3">
          {filters.defs.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              <Select
                value={filters.values[f.key] || "ALL"}
                onValueChange={(v) => onFilter(f.key, v === "ALL" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`All ${f.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All {f.label.toLowerCase()}</SelectItem>
                  {(filters.lookups[f.key] ?? []).map((o) => {
                    const value = f.valueKey === "slug" ? o.slug ?? o.id : o.id;
                    return (
                      <SelectItem key={o.id} value={value}>
                        {o.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          ))}
          {filters.showUploader && (
            <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
              <div className="space-y-1">
                <Label className="text-xs">Uploaded by</Label>
                <Select value={filters.uploader || "ALL"} onValueChange={(v) => onUploader(v === "ALL" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All uploaders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All uploaders</SelectItem>
                    {filters.uploaderOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Admin ID (cuid)</Label>
                <Input
                  value={filters.uploader}
                  onChange={(e) => onUploader(e.target.value.trim())}
                  placeholder="Paste admin cuid…"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => { onClearFilters(); setPopOpen(false); }}>
              <X className="mr-1 h-3.5 w-3.5" /> Clear all
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <DensityToggle value={density} onChange={onDensity} />
    </div>
  );
}

export function BulkBar({
  count,
  isSuper,
  busy,
  onVerify,
  onReject,
  onExport,
  onDelete,
  onSubmit,
  onClear,
}: {
  count: number;
  isSuper: boolean;
  busy: boolean;
  onVerify: () => void;
  onReject: () => void;
  onExport: () => void;
  onDelete: () => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-xl backdrop-blur dark:border-white/10 dark:bg-[#0b1220]/95">
      <span className="mr-1 text-[13px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
        {count} selected
      </span>
      {!isSuper && (
        <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={onSubmit}>
          <Send className="mr-1.5 h-3.5 w-3.5" /> Submit for review
        </Button>
      )}
      {isSuper && (
        <>
          <Button type="button" size="sm" disabled={busy} onClick={onVerify} className="bg-emerald-600 text-white hover:bg-emerald-700">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Verify
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onReject}>
            <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
          </Button>
        </>
      )}
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onExport}>
        <Download className="mr-1.5 h-3.5 w-3.5" /> Export
      </Button>
      {isSuper && (
        <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={onDelete}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
        </Button>
      )}
      <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function DeleteConfirm({
  open,
  title,
  message,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RejectDialog({
  open,
  count,
  pending,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  count: number;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setNote("");
          onCancel();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reject {count > 1 ? `${count} items` : "item"}</DialogTitle>
          <DialogDescription>
            Rejected items stay hidden until the uploader fixes them and resubmits. A note is required.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Quality issue - e.g. wrong dates, missing PDF…"
          rows={3}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={!note.trim() || pending} onClick={() => onConfirm(note.trim())}>
            {pending ? "Saving…" : "Reject"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AuditDialog({
  open,
  onOpenChange,
  title,
  entity,
  mine,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  entity: string;
  mine: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" /> {title}
          </DialogTitle>
          <DialogDescription>
            {mine ? "Only actions on your own uploads." : "Every create, edit, verify, reject, delete and import."}
          </DialogDescription>
        </DialogHeader>
        <AuditTimeline entity={entity} limit={40} mine={mine} />
      </DialogContent>
    </Dialog>
  );
}

export function ActiveFilterPills({
  pills,
  onRemove,
  onClear,
}: {
  pills: { key: string; label: string }[];
  onRemove: (key: string) => void;
  onClear: () => void;
}) {
  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {pills.map((p) => (
        <Badge key={p.key} variant="secondary" className="gap-1 pl-2.5">
          {p.label}
          <button type="button" onClick={() => onRemove(p.key)} aria-label={`Remove ${p.label} filter`} className="rounded-full hover:text-red-600">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <button type="button" onClick={onClear} className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
        Clear all
      </button>
    </div>
  );
}
