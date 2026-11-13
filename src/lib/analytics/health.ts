import type { HealthItem, HealthStatus } from "./types";

export interface HealthInput {
  perJobViews: number;
  siteViews: number;
  brokenLinks: number;
  checkedLinks: number;
  failedImports: number;
  duplicateGroups: number;
  expiringSoon: number;
  crawlerLastRunAt: string | null;
  crawlerErrors: number;
  sitemapOk: boolean;
  duplicateContentGroups: number;
  nowIso: string;
}

export function evaluateHealth(input: HealthInput): HealthItem[] {
  const at = input.nowIso;
  const viewStatus: HealthStatus = input.siteViews === 0 ? "warning" : Math.abs(input.perJobViews - input.siteViews) > Math.max(100, input.siteViews * 0.5) ? "critical" : "ok";
  const linkStatus: HealthStatus = input.brokenLinks > 0 ? (input.brokenLinks > 5 ? "critical" : "warning") : "ok";
  const importStatus: HealthStatus = input.failedImports > 0 ? "warning" : "ok";
  const dupeStatus: HealthStatus = input.duplicateGroups > 0 ? "warning" : "ok";
  const expiryStatus: HealthStatus = input.expiringSoon > 20 ? "warning" : "ok";
  const crawlerStatus: HealthStatus = !input.crawlerLastRunAt ? "warning" : input.crawlerErrors > 0 ? "warning" : "ok";
  const sitemapStatus: HealthStatus = input.sitemapOk ? "ok" : "critical";
  const contentStatus: HealthStatus = input.duplicateContentGroups > 0 ? "warning" : "ok";
  return [
    {
      key: "view-consistency",
      title: "Job view tracking consistency",
      status: viewStatus,
      detail: input.siteViews === 0 ? "No tracked views in range; counters only." : `Tracked ${input.siteViews.toLocaleString("en-IN")} vs job counters ${input.perJobViews.toLocaleString("en-IN")}.`,
      checkedAt: at,
      href: "/admin/analytics?tab=monitoring",
      actionLabel: "Inspect",
    },
    {
      key: "apply-links",
      title: "Broken or redirected apply links",
      status: linkStatus,
      detail: input.checkedLinks === 0 ? "No apply links to check." : `${input.brokenLinks} of ${input.checkedLinks} sampled links look broken.`,
      checkedAt: at,
      href: "/admin/expiring",
      actionLabel: "Review",
    },
    {
      key: "bulk-import",
      title: "Last bulk import errors",
      status: importStatus,
      detail: input.failedImports === 0 ? "No failing imports in range." : `${input.failedImports} imports had row errors.`,
      checkedAt: at,
      href: "/admin/bulk-upload",
      actionLabel: "Open",
    },
    {
      key: "duplicate-categories",
      title: "Duplicate categories",
      status: dupeStatus,
      detail: input.duplicateGroups === 0 ? "No near-duplicates found." : `${input.duplicateGroups} suspected duplicate groups.`,
      checkedAt: at,
      href: "/admin/categories",
      actionLabel: "Merge",
    },
    {
      key: "expiring",
      title: "Jobs expiring within 3 days",
      status: expiryStatus,
      detail: `${input.expiringSoon} jobs close within 3 days.`,
      checkedAt: at,
      href: "/admin/expiring",
      actionLabel: "View",
    },
    {
      key: "crawler",
      title: "Crawler last run",
      status: crawlerStatus,
      detail: !input.crawlerLastRunAt ? "No crawler run recorded yet." : `Last run ${input.crawlerLastRunAt} with ${input.crawlerErrors} errors.`,
      checkedAt: at,
      href: "/admin/review",
      actionLabel: "Review",
    },
    {
      key: "sitemap",
      title: "Sitemap and indexing ping",
      status: sitemapStatus,
      detail: input.sitemapOk ? "Sitemap reachable." : "Sitemap check failed.",
      checkedAt: at,
      href: "/sitemap.xml",
      actionLabel: "Open",
    },
    {
      key: "duplicate-content",
      title: "Duplicate content scan",
      status: contentStatus,
      detail: input.duplicateContentGroups === 0 ? "No duplicate titles found." : `${input.duplicateContentGroups} duplicate title groups.`,
      checkedAt: at,
      href: "/admin/jobs",
      actionLabel: "Review",
    },
  ];
}
