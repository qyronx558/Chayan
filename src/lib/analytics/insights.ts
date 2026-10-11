import { findDuplicateGroups } from "./parse";
import type { InsightItem } from "./types";

export function buildInsights(input: {
  views: number;
  signups: number;
  perJobViews: number;
  siteViews: number;
  categoryNames: string[];
  categoryJobCounts: Array<{ name: string; jobs: number }>;
  totalJobs: number;
}): InsightItem[] {
  const out: InsightItem[] = [];
  const conversion = input.views > 0 ? (input.signups / input.views) * 100 : 0;
  if (input.views >= 200 && conversion < 0.1) {
    out.push({
      key: "low-conversion",
      title: "Views-to-signup conversion below 0.1%",
      explanation: `${conversion.toFixed(3)}% of ${input.views.toLocaleString("en-IN")} views signed up in this period.`,
      severity: "warning",
      tab: "audience",
      href: "/admin/analytics?tab=audience",
    });
  }
  if (input.siteViews > 0 && input.perJobViews > input.siteViews * 2 && input.perJobViews > 50) {
    out.push({
      key: "view-mismatch",
      title: "Per-job views inconsistent with site-wide views",
      explanation: `Job-level counters total ${input.perJobViews.toLocaleString("en-IN")} against ${input.siteViews.toLocaleString("en-IN")} tracked page views.`,
      severity: "critical",
      tab: "monitoring",
      href: "/admin/analytics?tab=monitoring",
    });
  }
  const dupes = findDuplicateGroups(input.categoryNames);
  if (dupes.length > 0) {
    const sample = dupes[0].join(" / ");
    out.push({
      key: "duplicate-categories",
      title: "Near-duplicate category names detected",
      explanation: `${dupes.length} suspected ${dupes.length === 1 ? "pair" : "pairs"} found, e.g. ${sample}.`,
      severity: "warning",
      tab: "content",
      href: "/admin/analytics?tab=content",
    });
  }
  const sorted = [...input.categoryJobCounts].sort((a, b) => b.jobs - a.jobs);
  const top3 = sorted.slice(0, 3).reduce((n, c) => n + c.jobs, 0);
  if (input.totalJobs > 0 && top3 / input.totalJobs > 0.5) {
    const pct = Math.round((top3 / input.totalJobs) * 100);
    out.push({
      key: "category-concentration",
      title: "Top categories hold over 50% of jobs",
      explanation: `Top 3 categories hold ${pct}% of ${input.totalJobs.toLocaleString("en-IN")} jobs. Consider rebalancing.`,
      severity: "info",
      tab: "overview",
      href: "/admin/analytics?tab=overview",
    });
  }
  return out;
}
