"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Bookmark, RotateCcw, Plus, UploadCloud } from "lucide-react";
import { PageSizeSelect } from "./PageSizeSelect";
import { DensityToggle } from "./DensityToggle";
import type { Density } from "@/lib/admin/usePageSize";

export interface SavedView {
  name: string;
  search: string;
  status: string;
  moderation: string;
}

interface DataTableAdvancedProps {
  module: string;
  search: string;
  onSearch: (v: string) => void;
  statusFilter: string;
  onStatusFilter: (v: string) => void;
  moderationFilter?: string;
  onModerationFilter?: (v: string) => void;
  total?: number;
  selectedCount?: number;
  onNew?: () => void;
  newLabel?: string;
  onOpenImport?: () => void;
  statusOptions?: { value: string; label: string }[];
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (n: number) => void;
  density?: Density;
  onDensityChange?: (d: Density) => void;
}

/**
 * Shared SaaS toolbar for all 6 modules: debounced search, status + moderation
 * filters, saved views (localStorage), result count. Keeps existing page state
 * as source of truth - this component is purely presentational.
 */
export function DataTableAdvanced({
  module,
  search,
  onSearch,
  statusFilter,
  onStatusFilter,
  moderationFilter,
  onModerationFilter,
  total,
  selectedCount,
  onNew,
  newLabel,
  onOpenImport,
  statusOptions,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  density,
  onDensityChange,
}: DataTableAdvancedProps) {
  const storageKey = `admin-view:${module}`;
  const [draft, setDraft] = useState(search);
  const [views, setViews] = useState<SavedView[]>([]);

  // Sync external search reset (e.g. view apply) into local debounced draft.
  useEffect(() => {
    setDraft(search);
  }, [search]);

  // Load saved views once per module (localStorage, no server dependency).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setViews(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  // Debounce search input -> parent query.
  useEffect(() => {
    const t = setTimeout(() => {
      if (draft !== search) onSearch(draft);
    }, 350);
    return () => clearTimeout(t);
  }, [draft, search, onSearch]);

  const saveView = () => {
    const name = window.prompt("Save current filters as view:", search || statusFilter || "Untitled view");
    if (!name) return;
    const next = [...views, { name, search: draft, status: statusFilter, moderation: moderationFilter ?? "" }].slice(-8);
    setViews(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const applyView = (v: SavedView) => {
    setDraft(v.search);
    onSearch(v.search);
    onStatusFilter(v.status);
    onModerationFilter?.(v.moderation);
  };

  const clearAll = () => {
    setDraft("");
    onSearch("");
    onStatusFilter("");
    onModerationFilter?.("");
  };

  const statuses = statusOptions ?? [
    { value: "ACTIVE", label: "Active" },
    { value: "EXPIRED", label: "Expired" },
    { value: "UPCOMING", label: "Upcoming" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Search ${module.toLowerCase()} by title, slug, dept… (⌘K)`}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter || "ALL"} onValueChange={(v) => onStatusFilter(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onModerationFilter && (
          <Select value={moderationFilter || "ALL"} onValueChange={(v) => onModerationFilter(v === "ALL" ? "" : v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Moderation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All moderation</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button type="button" size="sm" variant="outline" onClick={saveView}>
          <Bookmark className="mr-1 h-3.5 w-3.5" /> Save view
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={clearAll}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
        </Button>
        {density && onDensityChange && (
          <DensityToggle value={density} onChange={onDensityChange} />
        )}
        {typeof pageSize === "number" && pageSizeOptions && onPageSizeChange && (
          <PageSizeSelect value={pageSize} options={pageSizeOptions} onChange={onPageSizeChange} />
        )}
        <div className="ml-auto flex items-center gap-2">
          {onOpenImport && (
            <Button type="button" size="sm" variant="outline" onClick={onOpenImport}>
              <UploadCloud className="mr-1 h-3.5 w-3.5" /> Import
            </Button>
          )}
          {onNew && (
            <Button type="button" size="sm" onClick={onNew}>
              <Plus className="mr-1 h-3.5 w-3.5" /> {newLabel ?? "New"}
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {typeof total === "number" && (
          <Badge variant="secondary">{total} rows</Badge>
        )}
        {typeof selectedCount === "number" && selectedCount > 0 && (
          <Badge className="bg-paper-3 text-paper">{selectedCount} selected across pages</Badge>
        )}
        {views.map((v) => (
          <button
            key={v.name}
            type="button"
            onClick={() => applyView(v)}
            className="rounded-full border border-rule px-2.5 py-0.5 font-medium text-muted-foreground hover:border-rule hover:text-brick  dark:text-muted-foreground"
          >
            {v.name}
          </button>
        ))}
      </div>
    </div>
  );
}
