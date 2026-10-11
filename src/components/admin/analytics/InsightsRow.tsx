"use client";

import Link from "next/link";
import { Info, TriangleAlert, OctagonX, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InsightItem } from "@/lib/analytics/types";

const META: Record<InsightItem["severity"], { icon: typeof Info; cls: string }> = {
  info: { icon: Info, cls: "text-sky-600 dark:text-sky-400" },
  warning: { icon: TriangleAlert, cls: "text-amber-600 dark:text-amber-400" },
  critical: { icon: OctagonX, cls: "text-rose-600 dark:text-rose-400" },
};

export function InsightsRow({ items, onSelect }: { items: InsightItem[]; onSelect: (tab: InsightItem["tab"]) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Auto insights">
      {items.map((ins) => {
        const M = META[ins.severity];
        const Icon = M.icon;
        return (
          <button
            key={ins.key}
            type="button"
            onClick={() => onSelect(ins.tab)}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-teal-700/40 dark:border-white/[0.06] dark:bg-[#0b1220]"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <Icon className={cn("h-4 w-4", M.cls)} />
              <span className={cn("uppercase tracking-wide", M.cls)}>{ins.severity}</span>
            </span>
            <span className="mt-1.5 block text-sm font-semibold text-slate-900 dark:text-slate-100">{ins.title}</span>
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{ins.explanation}</span>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
              View in {ins.tab} <ArrowRight className="h-3 w-3" />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function InsightLinkFix() {
  return <Link href="/admin/analytics" className="hidden" aria-hidden="true" tabIndex={-1}>x</Link>;
}
