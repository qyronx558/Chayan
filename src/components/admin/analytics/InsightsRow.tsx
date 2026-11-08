"use client";

import Link from "next/link";
import { Info, TriangleAlert, OctagonX, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InsightItem } from "@/lib/analytics/types";

const META: Record<InsightItem["severity"], { icon: typeof Info; cls: string }> = {
  info: { icon: Info, cls: "text-brick dark:text-brick" },
  warning: { icon: TriangleAlert, cls: "text-brick dark:text-brick" },
  critical: { icon: OctagonX, cls: "text-brick dark:text-brick" },
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
            className="rounded-xl border border-rule bg-background p-4 text-left transition-colors hover:border-rule  "
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <Icon className={cn("h-4 w-4", M.cls)} />
              <span className={cn("", M.cls)}>{ins.severity}</span>
            </span>
            <span className="mt-1.5 block text-sm font-semibold text-foreground dark:text-paper">{ins.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground dark:text-muted-foreground">{ins.explanation}</span>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brick dark:text-brick">
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
