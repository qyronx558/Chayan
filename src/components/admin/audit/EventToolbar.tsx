"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, ListFilter } from "lucide-react";
import { DisplayPopover, FilterPanel } from "./FilterPanel";
import type { AuditFilters, RowDensity } from "./types";

function useIsDesktop() {
  const [desktop, setDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

function FiltersLabel({ activeCount }: { activeCount: number }) {
  return (
    <>
      <ListFilter className="mr-1.5 h-4 w-4" />
      <span className="leading-none">Filters</span>
      {activeCount > 0 ? (
        <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-700 px-1 text-[11px] font-bold leading-none text-white">
          {activeCount}
        </span>
      ) : null}
    </>
  );
}

export function EventToolbar({
  filters,
  onFilters,
  activeCount,
  filtersOpen,
  onFiltersOpen,
  density,
  onDensity,
  grouped,
  onGrouped,
  showActor,
  resultCount,
}: {
  filters: AuditFilters;
  onFilters: (f: AuditFilters) => void;
  activeCount: number;
  filtersOpen: boolean;
  onFiltersOpen: (v: boolean) => void;
  density: RowDensity;
  onDensity: (d: RowDensity) => void;
  grouped: boolean;
  onGrouped: (v: boolean) => void;
  showActor: boolean;
  resultCount: number;
}) {
  const desktop = useIsDesktop();
  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <Input
          value={filters.q}
          onChange={(e) => onFilters({ ...filters, q: e.target.value })}
          placeholder="Search summary, entity, actor…"
          className="h-9 min-w-0 bg-white pl-9 dark:bg-[#0b1220]"
          aria-label="Search events"
        />
      </div>
      {desktop ? (
        <Popover open={filtersOpen} onOpenChange={onFiltersOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 shrink-0 border-slate-200 bg-white px-3 text-sm leading-none dark:border-white/10 dark:bg-[#0b1220]"
              aria-expanded={filtersOpen}
              aria-label="Toggle filters"
            >
              <FiltersLabel activeCount={activeCount} />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(520px,calc(100vw-2rem)] border-slate-200 bg-white p-0 dark:border-white/10 dark:bg-[#0b1220]"
            align="center"
            side="bottom"
            sideOffset={8}
          >
            <FilterPanel
              filters={filters}
              onChange={onFilters}
              showActor={showActor}
              resultCount={resultCount}
              onClose={() => onFiltersOpen(false)}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <Button
          variant="outline"
          className="h-9 shrink-0 border-slate-200 bg-white px-3 text-sm leading-none dark:border-white/10 dark:bg-[#0b1220]"
          aria-expanded={filtersOpen}
          aria-label="Toggle filters"
          onClick={() => onFiltersOpen(!filtersOpen)}
        >
          <FiltersLabel activeCount={activeCount} />
        </Button>
      )}
      <DisplayPopover density={density} onDensity={onDensity} grouped={grouped} onGrouped={onGrouped} />
    </div>
  );
}
