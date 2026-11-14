import { prisma } from "@/lib/prisma"
import { defaultSettings, type BotSettings, type BotSettingsPatch, type SourceOverride } from "./control"
import type { SourceDef } from "./types"

const ID = "default"

type Row = BotSettings & { updatedAt: Date; updatedById: string | null }

function pick(row: Row): BotSettings {
  return {
    enabled: row.enabled,
    centralEnabled: row.centralEnabled,
    stateEnabled: row.stateEnabled,
    districtEnabled: row.districtEnabled,
    autoApprove: row.autoApprove,
    autoApproveDailyCap: row.autoApproveDailyCap,
    minScore: row.minScore,
    minConfidence: row.minConfidence,
    maxNewPerSource: row.maxNewPerSource,
    maxLlmCalls: row.maxLlmCalls,
    geminiModel: row.geminiModel,
  }
}

/**
 * Effective bot settings: the saved admin row, or the environment defaults.
 * Never throws - if the table is missing (migration not applied yet) the
 * environment defaults are used, so ingest keeps working.
 */
export async function getBotSettings(): Promise<BotSettings & { saved: boolean; updatedAt: Date | null }> {
  try {
    const row = (await prisma.ingestSettings.findUnique({ where: { id: ID } })) as Row | null
    if (row) return { ...pick(row), saved: true, updatedAt: row.updatedAt }
  } catch {
    // table not migrated yet - fall through to defaults
  }
  return { ...defaultSettings(process.env), saved: false, updatedAt: null }
}

export async function saveBotSettings(patch: BotSettingsPatch, userId: string): Promise<BotSettings> {
  const base = await getBotSettings()
  const { saved: _saved, updatedAt: _updatedAt, ...current } = base
  const next = { ...current, ...patch, updatedById: userId }
  const row = (await prisma.ingestSettings.upsert({
    where: { id: ID },
    create: { id: ID, ...next },
    update: next,
  })) as Row
  return pick(row)
}

export async function getSourceOverrides(): Promise<SourceOverride[]> {
  try {
    const rows = await prisma.ingestSource.findMany({ orderBy: { createdAt: "asc" } })
    return rows.map((r) => ({ id: r.id, enabled: r.enabled, custom: r.custom, def: (r.def as SourceDef | null) ?? null }))
  } catch {
    return []
  }
}
