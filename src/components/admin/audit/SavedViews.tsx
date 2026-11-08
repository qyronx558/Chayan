"use client";
import { cn } from "@/lib/utils";
import { SAVED_VIEWS } from "./types";
import type { AuditSavedView } from "./types";

export function SavedViews({
  value,
  onChange,
  counts,
}: {
  value: AuditSavedView;
  onChange: (v: AuditSavedView) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="relative">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5 pr-8" role="tablist" aria-label="Saved views">
        {SAVED_VIEWS.map((v) => {
          const active = value === v.key;
          const count = counts[v.key] ?? 0;
          const amber = v.key === "needs-review" && count > 0;
          return (
            <button
              key={v.key}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(v.key)}
              className={cn(
                "inline-flex h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rule",
                active
                  ? "border-rule bg-paper-3 text-brick dark:border-rule dark:bg-paper-3 dark:text-brick"
                  : "border-rule bg-background text-muted-foreground hover:border-rule hover:text-foreground  dark:bg-transparent dark:text-muted-foreground dark:hover:text-paper"
              )}
            >
              <span className="leading-none">{v.label}</span>
              <span className={cn("leading-none tabular-nums", amber ? "font-bold text-brick dark:text-brick" : "text-muted-foreground dark:text-muted-foreground")}>
                {count.toLocaleString("en-IN")}
              </span>
            </button>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-paper-2/80" aria-hidden />
    </div>
  );
}
