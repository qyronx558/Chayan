export type AnalyticsRangeKey = "7D" | "30D" | "90D" | "1Y";

export type AnalyticsRangeDays = 7 | 30 | 90 | 365;

export const RANGE_DAYS: Record<AnalyticsRangeKey, AnalyticsRangeDays> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
  "1Y": 365,
};

export function parseRangeKey(raw: string | null | undefined): AnalyticsRangeKey {
  if (raw === "30D" || raw === "30d" || raw === "30") return "30D";
  if (raw === "90D" || raw === "90d" || raw === "90") return "90D";
  if (raw === "1Y" || raw === "1y" || raw === "365") return "1Y";
  return "7D";
}

export function rangeDays(key: AnalyticsRangeKey): AnalyticsRangeDays {
  return RANGE_DAYS[key];
}

export interface TrendBucket {
  label: string;
  current: number;
  previous: number;
}

export interface MetricSeries {
  key: string;
  label: string;
  buckets: TrendBucket[];
  total: number;
  deltaPct: number | null;
}

export interface KpiItem {
  key: string;
  label: string;
  value: number;
  sub: string;
  deltaPct: number | null;
  spark: number[];
  display?: string;
}

export type InsightSeverity = "info" | "warning" | "critical";

export interface InsightItem {
  key: string;
  title: string;
  explanation: string;
  severity: InsightSeverity;
  tab: "overview" | "audience" | "content" | "acquisition" | "monitoring";
  href: string;
}

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
}

export interface CategoryBar {
  id: string;
  name: string;
  jobs: number;
  views: number;
  suspectDuplicate: boolean;
}

export interface PopularJob {
  id: string;
  title: string;
  slug: string;
  department: string;
  views: number;
  bookmarks: number;
  comments: number;
  href: string;
}

export interface OverviewPayload {
  kpis: KpiItem[];
  insights: InsightItem[];
  trend: MetricSeries[];
  statusDonut: DonutSlice[];
  categories: CategoryBar[];
  popular: PopularJob[];
}

export interface TrafficQualitySlice {
  label: string;
  value: number;
}

export interface FunnelStep {
  key: string;
  label: string;
  value: number;
  stepPct: number | null;
}

export interface HeatCell {
  dow: number;
  hour: number;
  value: number;
}

export interface AudiencePayload {
  kpis: KpiItem[];
  quality: TrafficQualitySlice[];
  devices: DonutSlice[];
  funnel: FunnelStep[];
  states: Array<{ name: string; visitors: number }>;
  heatmap: HeatCell[];
  avgTimeOnPageSec: number | null;
}

export interface ModuleRow {
  module: string;
  label: string;
  items: number;
  views: number;
  viewsPerItem: number;
  spark: number[];
}

export interface DemandRow {
  categoryId: string;
  category: string;
  jobs: number;
  jobShare: number;
  views: number;
  viewShare: number;
  gap: number;
  signal: "balanced" | "under" | "over";
}

export interface SearchRow {
  term: string;
  count: number;
  results: number;
}

export interface ContentPayload {
  modules: ModuleRow[];
  demand: DemandRow[];
  topSearches: SearchRow[];
  zeroSearches: SearchRow[];
}

export interface SourceBar {
  key: string;
  label: string;
  visitors: number;
}

export interface LandingRow {
  path: string;
  views: number;
  visitors: number;
}

export interface IntegrationState {
  key: "gsc" | "adsense" | "telegram";
  title: string;
  description: string;
  connected: boolean;
  summary: string | null;
  updatedAt: string | null;
}

export interface AcquisitionPayload {
  sources: SourceBar[];
  landing: LandingRow[];
  integrations: IntegrationState[];
}

export type HealthStatus = "ok" | "warning" | "critical";

export interface HealthItem {
  key: string;
  title: string;
  status: HealthStatus;
  detail: string;
  checkedAt: string;
  href: string;
  actionLabel: string;
}

export interface PerfPoint {
  label: string;
  latency: number | null;
  errors: number;
  botShare: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  href: string;
}

export interface AlertRuleItem {
  id: string;
  metric: string;
  threshold: number;
  channels: Array<"Email" | "Telegram">;
  enabled: boolean;
}

export interface MonitoringPayload {
  kpis: KpiItem[];
  health: HealthItem[];
  openIssues: number;
  perf: PerfPoint[];
  activity: ActivityItem[];
  alerts: AlertRuleItem[];
}

export interface AnalyticsPayload {
  range: AnalyticsRangeKey;
  generatedAt: string;
  overview: OverviewPayload;
  audience: AudiencePayload;
  content: ContentPayload;
  acquisition: AcquisitionPayload;
  monitoring: MonitoringPayload;
}

export interface MinePayload {
  range: AnalyticsRangeKey;
  generatedAt: string;
  kpis: KpiItem[];
  trend: MetricSeries[];
  topJobs: PopularJob[];
  feedback: Array<{ id: string; title: string; reason: string; createdAt: string; href: string }>;
}

export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
