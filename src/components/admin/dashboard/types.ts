export type DashboardRange = 7 | 30 | 90

export type DashboardRole = "ADMIN" | "SUPER_ADMIN"

export interface KpiDatum {
  key: string
  label: string
  value: number
  sub: string
  deltaPct: number | null
  spark: number[]
  needsAction: boolean
}

export interface TrendPoint {
  label: string
  current: number
  previous: number
}

export interface TrendDatum {
  points: TrendPoint[]
  total: number
  changePct: number | null
}

export interface AttentionDatum {
  key: string
  label: string
  sub: string
  count: number
  href: string
}

export interface RecentJobDatum {
  id: string
  title: string
  org: string
  uploader: string
  moderation: string
  lastDate: string | null
  createdAt: string
  href: string
}

export interface PipelineSegment {
  key: string
  label: string
  count: number
  pct: number
}

export interface OldestPending {
  id: string
  title: string
  module: string
  createdAt: string
}

export interface PipelineDatum {
  segments: PipelineSegment[]
  total: number
  avgReviewHours: number | null
  approvalRate: number | null
  oldestPending: OldestPending | null
}

export interface DashboardPayload {
  role: DashboardRole
  range: DashboardRange
  generatedAt: string
  kpis: KpiDatum[]
  trend: TrendDatum
  attention: AttentionDatum[]
  recent: RecentJobDatum[]
  pipeline: PipelineDatum
}

export interface LibraryModuleDatum {
  key: string
  label: string
  count: number
  href: string
}

export interface ActivityEvent {
  id: string
  action: string
  entity: string
  text: string
  actor: string
  createdAt: string
}

export interface LibraryPayload {
  total: number
  modules: LibraryModuleDatum[]
  activity: ActivityEvent[]
}

export interface FeedbackItem {
  id: string
  module: string
  title: string
  reason: string
  createdAt: string
  href: string
}

export interface ModuleCatalogEntry {
  delegate: string
  label: string
  href: string
}

export const MODULE_CATALOG: readonly ModuleCatalogEntry[] = [
  { delegate: "job", label: "Gov Jobs", href: "/admin/jobs" },
  { delegate: "privateJob", label: "Private Jobs", href: "/admin/private-jobs" },
  { delegate: "result", label: "Results", href: "/admin/results" },
  { delegate: "admitCard", label: "Admit Cards", href: "/admin/admit-cards" },
  { delegate: "answerKey", label: "Answer Keys", href: "/admin/answer-keys" },
  { delegate: "admission", label: "Admissions", href: "/admin/admissions" },
  { delegate: "syllabus", label: "Syllabus", href: "/admin/syllabus" },
  { delegate: "blogPost", label: "Blog Posts", href: "/admin/blog" },
]

export function parseRange(raw: string | null): DashboardRange {
  if (raw === "30") return 30
  if (raw === "90") return 90
  return 7
}

export function changePct(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}
