import type { BotSettings } from "@/lib/ingest/control"
import type { SourceDef } from "@/lib/ingest/types"

export type { BotSettings }

export interface SettingsResponse {
  success: boolean
  settings: BotSettings & { saved: boolean; updatedAt: string | null }
  environment: { defaultModel: string; runNowConfigured: boolean; runTarget: "dev" | "production" | null; repo: string | null }
}

export interface SourceStats {
  posted: number
  duplicate: number
  skipped: number
  failed: number
  lastActivity: string | null
}

export interface SourceRow extends SourceDef {
  enabled: boolean
  custom: boolean
  stats: SourceStats
}

export interface SourcesResponse {
  success: boolean
  total: number
  page: number
  pageSize: number
  totals: { level: "CENTRAL" | "STATE" | "DISTRICT"; total: number; enabled: number }[]
  states: string[]
  items: SourceRow[]
}

export interface GhRun {
  id: number
  status: string
  conclusion: string | null
  event: string
  createdAt: string
  updatedAt: string
  url: string
  title: string
}

export interface RunsResponse {
  success: boolean
  configured: boolean
  target?: "dev" | "production"
  runs: GhRun[]
  error?: string
}

export interface ActivityItem {
  id: string
  sourceId: string
  url: string
  kind: string
  status: "POSTED" | "SKIPPED" | "DUPLICATE" | "FAILED"
  reason: string | null
  entityType: string | null
  entityId: string | null
  quality: number | null
  confidence: number | null
  autoApproved: boolean
  attempts: number
  updatedAt: string
}

export interface CrawlRun {
  id: string
  source: string
  startedAt: string
  finishedAt: string | null
  imported: number
  errors: number
  detail: string | null
}

export interface ActivityResponse {
  success: boolean
  last24h: { posted: number; skipped: number; duplicate: number; failed: number; autoApproved: number }
  runs: CrawlRun[]
  items: ActivityItem[]
  total: number
  page: number
  pageSize: number
}

export interface PreviewResponse {
  success: boolean
  found: number
  relevant: number
  empty: boolean
  nextPage: string | null
  items: { title: string; url: string; date: string | null; triage: { relevant: boolean; kind: string | null; reason: string } }[]
}

export const LEVEL_LABEL: Record<string, string> = { CENTRAL: "Central", STATE: "State", DISTRICT: "District" }
