"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Inbox } from "lucide-react";
import { DataCard } from "@/components/admin/dashboard/DataCard";
import type { DonutSlice } from "@/lib/analytics/types";

const PALETTE = ["var(--color-brick)", "var(--color-ink-2)", "var(--color-brick-ink)", "var(--color-ink)", "var(--color-rule-2)", "var(--color-muted)"];

export function Donut({ title, subtitle, slices }: { title: string; subtitle?: string; slices: DonutSlice[] }) {
  const empty = slices.every((s) => s.value === 0);
  const total = slices.reduce((n, s) => n + s.value, 0);
  return (
    <DataCard title={title} subtitle={subtitle} className="h-full">
      {empty ? (
        <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground dark:text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">No data in this period</p>
        </div>
      ) : (
        <div className="h-[260px] w-full" role="img" aria-label={`${title} donut chart, total ${total}`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="value" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={2} strokeWidth={2} stroke="var(--card)">
                {slices.map((s, i) => (
                  <Cell key={s.key} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </DataCard>
  );
}
