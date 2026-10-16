"use client";

import { forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  avatarThemeFor,
  extractAcronym,
  initialsFor,
  normalizeQuery,
  type PickerItem,
} from "./picker-utils";

function HighlightedName({ text, query }: { text: string; query: string }) {
  const q = normalizeQuery(query);
  if (!q) return <span className="truncate">{text}</span>;
  const lower = text.toLowerCase();
  const start = lower.indexOf(q);
  if (start < 0) return <span className="truncate">{text}</span>;
  return (
    <span className="truncate">
      {text.slice(0, start)}
      <span className="rounded bg-teal-100 font-bold text-teal-900 dark:bg-teal-900/60 dark:text-teal-100">
        {text.slice(start, start + q.length)}
      </span>
      {text.slice(start + q.length)}
    </span>
  );
}

interface DepartmentRowProps {
  item: PickerItem;
  rowId: string;
  selected: boolean;
  active: boolean;
  query: string;
  onSelect: () => void;
  onHover: () => void;
}

export const DepartmentRow = forwardRef<HTMLButtonElement, DepartmentRowProps>(function DepartmentRow(
  { item, rowId, selected, active, query, onSelect, onHover },
  ref
) {
  const { text, acronym } = extractAcronym(item.name);
  return (
    <button
      ref={ref}
      id={rowId}
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        "relative flex h-[52px] w-full min-w-0 items-center gap-3 overflow-hidden rounded-lg px-3 text-left outline-none transition-colors",
        selected
          ? "bg-teal-50 dark:bg-teal-950/50"
          : active
            ? "bg-teal-50/70 dark:bg-teal-950/30"
            : "hover:bg-teal-50/70 dark:hover:bg-teal-950/30",
        "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600"
      )}
    >
      {selected && <span className="absolute inset-y-1 left-0 w-1 rounded-full bg-teal-600" />}
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
          avatarThemeFor(item.name)
        )}
      >
        {initialsFor(item.name)}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
        <HighlightedName text={text} query={query} />
        {acronym && (
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-300">
            {acronym}
          </span>
        )}
      </span>
      {selected && <Check className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />}
    </button>
  );
});
