"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AlertTriangle, Check, Plus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { PickerHeader } from "./PickerHeader";
import { SearchBar } from "./SearchBar";
import { DepartmentRow } from "./DepartmentRow";
import { EmptyState } from "./EmptyState";
import { CreateForm } from "./CreateForm";
import { useDepartmentSearch } from "./useDepartmentSearch";
import type { PickerItem } from "./picker-utils";

const VIRTUALIZE_AFTER = 200;
const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 28;

interface RelationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PickerItem[];
  value?: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<{ id: string; name: string } | null>;
  title: string;
  subtitle: string;
  singular: string;
  plural: string;
  allowCreate?: boolean;
  allowNone?: boolean;
  noneLabel?: string;
  loading?: boolean;
  searchPlaceholder?: string;
  onClear?: () => void;
}

type NavEntry = { key: string; id: string | null };

interface VirtualRow {
  kind: "header" | "item";
  letter?: string;
  item?: PickerItem;
  navIndex: number;
}

export function RelationPicker({
  open,
  onOpenChange,
  items,
  value,
  onSelect,
  onCreate,
  title,
  subtitle,
  singular,
  plural,
  allowCreate = true,
  allowNone = false,
  noneLabel = "None",
  loading = false,
  searchPlaceholder,
  onClear,
}: RelationPickerProps) {
  const listboxId = useId();
  const [view, setView] = useState<"list" | "create">("list");
  const [createSeed, setCreateSeed] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const search = useDepartmentSearch(items);

  const selectedId = value ?? null;
  const stale = !!selectedId && !items.some((item) => item.id === selectedId);

  const navEntries = useMemo<NavEntry[]>(() => {
    const entries: NavEntry[] = [];
    if (allowNone && !search.searching) entries.push({ key: "__none", id: null });
    for (const item of search.results) entries.push({ key: item.id, id: item.id });
    return entries;
  }, [allowNone, search.searching, search.results]);

  const selectedNavIndex = useMemo(
    () => Math.max(0, navEntries.findIndex((entry) => entry.id === selectedId && entry.id !== null)),
    [navEntries, selectedId]
  );

  useEffect(() => {
    if (open) {
      setView("list");
      setCreateSeed("");
      setActiveIndex(selectedNavIndex);
      setDragY(0);
      search.setQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  useEffect(() => {
    setActiveIndex(selectedNavIndex);
  }, [search.debounced, selectedNavIndex]);

  const virtualRows = useMemo<VirtualRow[]>(() => {
    const rows: VirtualRow[] = [];
    let nav = 0;
    if (allowNone && !search.searching) {
      rows.push({ kind: "item", item: undefined, navIndex: nav });
      nav += 1;
    }
    if (search.searching) {
      for (const item of search.results) {
        rows.push({ kind: "item", item, navIndex: nav });
        nav += 1;
      }
      return rows;
    }
    for (const group of search.groups) {
      rows.push({ kind: "header", letter: group.letter, navIndex: -1 });
      for (const item of group.items) {
        rows.push({ kind: "item", item, navIndex: nav });
        nav += 1;
      }
    }
    return rows;
  }, [allowNone, search.searching, search.results, search.groups]);

  const virtualized = search.results.length > VIRTUALIZE_AFTER;

  const virtualizer = useVirtualizer({
    count: virtualRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (virtualRows[index]?.kind === "header" ? HEADER_HEIGHT : ROW_HEIGHT),
    overscan: 8,
    enabled: open && virtualized,
  });

  useEffect(() => {
    if (!open || view !== "list") return;
    if (virtualized) {
      const rowIndex = virtualRows.findIndex((row) => row.navIndex === activeIndex);
      if (rowIndex >= 0) virtualizer.scrollToIndex(rowIndex, { align: "auto" });
    } else {
      const entry = navEntries[activeIndex];
      const element = entry ? rowRefs.current.get(entry.key) : undefined;
      element?.scrollIntoView({ block: "nearest" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  const activate = (index: number) => {
    const entry = navEntries[index];
    if (!entry) return;
    if (entry.id === null) {
      onClear?.();
      onOpenChange(false);
      return;
    }
    onSelect(entry.id);
    onOpenChange(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (view !== "list" || navEntries.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, navEntries.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(navEntries.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      activate(activeIndex);
    }
  };

  const startCreate = (seed: string) => {
    setCreateSeed(seed);
    setView("create");
  };

  const submitCreate = async (name: string) => {
    setSaving(true);
    try {
      const created = await onCreate(name);
      if (created) {
        onSelect(created.id);
        toast(`${singular} created`, "success");
      }
      onOpenChange(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : `Failed to create ${singular.toLowerCase()}`, "destructive");
    } finally {
      setSaving(false);
    }
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    dragStart.current = event.touches[0].clientY;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (dragStart.current === null) return;
    const delta = event.touches[0].clientY - dragStart.current;
    if (delta > 0) setDragY(delta);
  };

  const handleTouchEnd = () => {
    if (dragY > 110) onOpenChange(false);
    setDragY(0);
    dragStart.current = null;
  };

  const activeEntry = navEntries[activeIndex];
  const showEmpty = !loading && search.searching && search.results.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-label={title}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
        className={cn(
          "flex max-h-[92vh] w-full min-w-0 max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0 duration-150",
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[90vh] max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl"
        )}
      >
        <div
          className="hidden shrink-0 cursor-grab touch-none items-center justify-center pt-2.5 active:cursor-grabbing max-sm:flex"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <span className="h-1.5 w-12 rounded-full bg-paper-3 dark:bg-background/20" />
        </div>

        <div className="min-w-0 shrink-0 px-5 pb-3 pt-5 max-sm:pt-1">
          <PickerHeader title={title} subtitle={subtitle} />
        </div>

        {view === "list" ? (
          <>
            <div className="min-w-0 shrink-0 px-5 pb-3">
              <SearchBar
                value={search.query}
                onChange={search.setQuery}
                placeholder={searchPlaceholder ?? `Search ${plural}...`}
                listboxId={listboxId}
                activeDescendantId={activeEntry ? `picker-row-${activeEntry.key}` : undefined}
                onKeyDown={handleKeyDown}
              />
            </div>

            {stale && (
              <div className="mx-5 mb-3 flex shrink-0 items-start gap-2 rounded-xl border border-rule bg-paper-2 p-2.5 text-xs text-brick dark:border-rule dark:bg-paper-2 dark:text-brick">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  The previously saved value is no longer available. Pick a replacement below
                  {allowNone ? " or choose None to clear it." : "."}
                </span>
              </div>
            )}

            <div
              ref={scrollRef}
              id={listboxId}
              role="listbox"
              aria-label={title}
              className="min-h-0 w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-2 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-paper-3 dark:hover:[&::-webkit-scrollbar-thumb]:bg-background/20"
              style={{ maxHeight: 360 }}
            >
              {loading ? (
                <div className="space-y-1.5 px-2 py-1">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex h-[52px] animate-pulse items-center gap-3 rounded-lg bg-paper-3 px-3 dark:bg-background/5">
                      <span className="h-9 w-9 rounded-lg bg-paper-3 dark:bg-background/10" />
                      <span className="h-4 flex-1 rounded bg-paper-3 dark:bg-background/10" />
                    </div>
                  ))}
                </div>
              ) : showEmpty ? (
                allowCreate ? (
                  <EmptyState query={search.debounced} singular={singular} onCreate={() => startCreate(search.debounced)} />
                ) : (
                  <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No match found for &lsquo;{search.debounced}&rsquo;.
                  </p>
                )
              ) : virtualized ? (
                <div
                  className="relative w-full min-w-0"
                  style={{ height: virtualizer.getTotalSize() }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const row = virtualRows[virtualRow.index];
                    if (!row) return null;
                    if (row.kind === "header") {
                      return (
                        <div
                          key={`header-${row.letter}`}
                          style={{ height: HEADER_HEIGHT, transform: `translateY(${virtualRow.start}px)` }}
                          className="absolute inset-x-0 top-0 px-2"
                        >
                          <p className="py-1 text-[11px] font-bold text-muted-foreground">
                            {row.letter}
                          </p>
                        </div>
                      );
                    }
                    if (!row.item) {
                      return (
                        <NoneRow
                          key="__none"
                          rowId="picker-row-__none"
                          label={noneLabel}
                          selected={selectedId === null}
                          active={activeIndex === row.navIndex}
                          top={virtualRow.start}
                          onSelect={() => activate(row.navIndex)}
                          onHover={() => setActiveIndex(row.navIndex)}
                        />
                      );
                    }
                    return (
                      <div
                        key={row.item.id}
                        style={{ height: ROW_HEIGHT, transform: `translateY(${virtualRow.start}px)` }}
                        className="absolute inset-x-0 top-0"
                      >
                        <DepartmentRow
                          item={row.item}
                          rowId={`picker-row-${row.item.id}`}
                          selected={selectedId === row.item.id}
                          active={activeIndex === row.navIndex}
                          query={search.debounced}
                          onSelect={() => activate(row.navIndex)}
                          onHover={() => setActiveIndex(row.navIndex)}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full min-w-0">
                  {allowNone && !search.searching && (
                    <NoneRow
                      rowId="picker-row-__none"
                      label={noneLabel}
                      selected={selectedId === null}
                      active={activeIndex === 0}
                      onSelect={() => activate(0)}
                      onHover={() => setActiveIndex(0)}
                      registerRef={(element) => {
                        if (element) rowRefs.current.set("__none", element);
                        else rowRefs.current.delete("__none");
                      }}
                    />
                  )}
                  {search.searching
                    ? search.results.map((item) => (
                        <DepartmentRow
                          key={item.id}
                          ref={(element) => {
                            if (element) rowRefs.current.set(item.id, element);
                            else rowRefs.current.delete(item.id);
                          }}
                          item={item}
                          rowId={`picker-row-${item.id}`}
                          selected={selectedId === item.id}
                          active={navEntries[activeIndex]?.id === item.id}
                          query={search.debounced}
                          onSelect={() => {
                            onSelect(item.id);
                            onOpenChange(false);
                          }}
                          onHover={() => {
                            const index = navEntries.findIndex((entry) => entry.id === item.id);
                            if (index >= 0) setActiveIndex(index);
                          }}
                        />
                      ))
                    : search.groups.map((group) => (
                        <div key={group.letter}>
                          <p className="sticky top-0 z-10 bg-background px-2 py-1 text-[11px] font-bold text-muted-foreground dark:bg-ink">
                            {group.letter}
                          </p>
                          {group.items.map((item) => (
                            <DepartmentRow
                              key={item.id}
                              ref={(element) => {
                                if (element) rowRefs.current.set(item.id, element);
                                else rowRefs.current.delete(item.id);
                              }}
                              item={item}
                              rowId={`picker-row-${item.id}`}
                              selected={selectedId === item.id}
                              active={navEntries[activeIndex]?.id === item.id}
                              query={search.debounced}
                              onSelect={() => {
                                onSelect(item.id);
                                onOpenChange(false);
                              }}
                              onHover={() => {
                                const index = navEntries.findIndex((entry) => entry.id === item.id);
                                if (index >= 0) setActiveIndex(index);
                              }}
                            />
                          ))}
                        </div>
                      ))}
                </div>
              )}
            </div>

            <div className="flex min-w-0 shrink-0 items-center justify-between gap-2 border-t border-rule px-5 py-3 ">
              <p className="truncate text-xs text-muted-foreground">
                {search.searching
                  ? `${search.results.length} of ${search.total} ${plural}`
                  : `${search.total} ${plural}`}
              </p>
              {allowCreate && (
                <Button type="button" variant="ghost" size="sm" onClick={() => startCreate(search.query.trim())}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create new {singular.toLowerCase()}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="min-w-0 shrink-0 px-5 pb-5 pt-1">
            <CreateForm
              initialName={createSeed}
              singular={singular}
              takenNames={search.takenNames}
              saving={saving}
              onCancel={() => setView("list")}
              onSubmit={submitCreate}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NoneRow({
  rowId,
  label,
  selected,
  active,
  onSelect,
  onHover,
  top,
  registerRef,
}: {
  rowId: string;
  label: string;
  selected: boolean;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
  top?: number;
  registerRef?: (element: HTMLButtonElement | null) => void;
}) {
  const content = (
    <button
      ref={registerRef}
      id={rowId}
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        "flex h-[52px] w-full min-w-0 items-center gap-2 rounded-lg px-3 text-left text-sm outline-none transition-colors",
        selected
          ? "bg-paper-3 dark:bg-paper-3"
          : active
            ? "bg-paper-3 dark:bg-paper-3"
            : "hover:bg-paper-3 dark:hover:bg-paper-3",
        "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rule"
      )}
    >
      <Check className={cn("h-4 w-4 shrink-0", selected ? "opacity-100" : "opacity-0")} />
      <span className="truncate text-muted-foreground">{label}</span>
    </button>
  );
  if (top === undefined) return content;
  return (
    <div
      style={{ height: ROW_HEIGHT, transform: `translateY(${top}px)` }}
      className="absolute inset-x-0 top-0"
    >
      {content}
    </div>
  );
}

interface EntityPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<{ id: string; name: string } | null>;
  loading?: boolean;
  allowCreate?: boolean;
  allowNone?: boolean;
  noneLabel?: string;
  onClear?: () => void;
}

export function DepartmentPicker({
  open,
  onOpenChange,
  departments,
  value,
  onSelect,
  onCreate,
  loading,
  allowCreate,
  allowNone,
  noneLabel,
  onClear,
}: EntityPickerProps & { departments: PickerItem[] }) {
  return (
    <RelationPicker
      open={open}
      onOpenChange={onOpenChange}
      items={departments}
      value={value}
      onSelect={onSelect}
      onCreate={onCreate}
      title="Select Department"
      subtitle="Search or create a department"
      singular="Department"
      plural="departments"
      loading={loading}
      allowCreate={allowCreate}
      allowNone={allowNone}
      noneLabel={noneLabel}
      onClear={onClear}
    />
  );
}

export function CategoryPicker({
  open,
  onOpenChange,
  categories,
  value,
  onSelect,
  onCreate,
  loading,
  allowCreate,
  allowNone,
  noneLabel,
  onClear,
}: EntityPickerProps & { categories: PickerItem[] }) {
  return (
    <RelationPicker
      open={open}
      onOpenChange={onOpenChange}
      items={categories}
      value={value}
      onSelect={onSelect}
      onCreate={onCreate}
      title="Select Category"
      subtitle="Search or create a category"
      singular="Category"
      plural="categories"
      loading={loading}
      allowCreate={allowCreate}
      allowNone={allowNone}
      noneLabel={noneLabel}
      onClear={onClear}
    />
  );
}

export function StatePicker({
  open,
  onOpenChange,
  states,
  value,
  onSelect,
  onCreate,
  loading,
  allowCreate = false,
  allowNone = true,
  noneLabel = "None",
  onClear,
}: EntityPickerProps & { states: PickerItem[] }) {
  return (
    <RelationPicker
      open={open}
      onOpenChange={onOpenChange}
      items={states}
      value={value}
      onSelect={onSelect}
      onCreate={onCreate}
      title="Select State"
      subtitle="Search states"
      singular="State"
      plural="states"
      loading={loading}
      allowCreate={allowCreate}
      allowNone={allowNone}
      noneLabel={noneLabel}
      onClear={onClear}
      searchPlaceholder="Search states..."
    />
  );
}

/** Districts of one state. Admins can't create districts - super admins add them under Locations. */
export function DistrictPicker({
  open,
  onOpenChange,
  districts,
  value,
  onSelect,
  onCreate,
  loading,
  allowNone = false,
  noneLabel = "None",
  onClear,
  stateName,
}: EntityPickerProps & { districts: PickerItem[]; stateName?: string }) {
  return (
    <RelationPicker
      open={open}
      onOpenChange={onOpenChange}
      items={districts}
      value={value}
      onSelect={onSelect}
      onCreate={onCreate}
      title="Select District"
      subtitle={
        stateName
          ? `Districts in ${stateName}. Missing one? Ask a super admin to add it under Locations.`
          : "Search districts"
      }
      singular="District"
      plural="districts"
      loading={loading}
      allowCreate={false}
      allowNone={allowNone}
      noneLabel={noneLabel}
      onClear={onClear}
      searchPlaceholder="Search districts..."
    />
  );
}

export function CompanyPicker({
  open,
  onOpenChange,
  companies,
  value,
  onSelect,
  onCreate,
  loading,
  allowCreate,
  allowNone,
  noneLabel,
  onClear,
}: EntityPickerProps & { companies: PickerItem[] }) {
  return (
    <RelationPicker
      open={open}
      onOpenChange={onOpenChange}
      items={companies}
      value={value}
      onSelect={onSelect}
      onCreate={onCreate}
      title="Select Company"
      subtitle="Search or add a company"
      singular="Company"
      plural="companies"
      loading={loading}
      allowCreate={allowCreate}
      allowNone={allowNone}
      noneLabel={noneLabel}
      onClear={onClear}
      searchPlaceholder="Search companies..."
    />
  );
}
