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
                "inline-flex h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                active
                  ? "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-200"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:text-white"
              )}
            >
              <span className="leading-none">{v.label}</span>
              <span className={cn("leading-none tabular-nums", amber ? "font-bold text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500")}>
                {count.toLocaleString("en-IN")}
              </span>
            </button>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-slate-100 to-transparent dark:from-[#070d1a]" aria-hidden />
    </div>
  );
}
