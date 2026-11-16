import { z } from "zod"
import { prisma } from "@/lib/prisma"

/** Super-admin controls for private-job seeding (single row "default"). */
export interface FeedSettings {
  enabled: boolean
  intervalHours: number
  autoPublishAi: boolean
  minConfidence: number
  maxAiPagesPerRun: number
  geminiModel: string | null
  saved: boolean
  updatedAt: Date | null
}

export const FEED_SETTINGS_DEFAULTS: Omit<FeedSettings, "saved" | "updatedAt"> = {
  enabled: true,
  intervalHours: 6,
  autoPublishAi: false,
  minConfidence: 0.8,
  maxAiPagesPerRun: 3,
  geminiModel: null,
}

export const feedSettingsPatchSchema = z
  .object({
    enabled: z.boolean(),
    intervalHours: z.number().int().min(1).max(72),
    autoPublishAi: z.boolean(),
    minConfidence: z.number().min(0.5).max(1),
    maxAiPagesPerRun: z.number().int().min(0).max(10),
    geminiModel: z
      .string()
      .trim()
      .max(80)
      .regex(/^[A-Za-z0-9._-]*$/, "Model name may only contain letters, digits, dot, dash and underscore")
      .nullable()
      .transform((v) => v || null),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update")

export async function getFeedSettings(): Promise<FeedSettings> {
  try {
    const row = await prisma.privateFeedSettings.findUnique({ where: { id: "default" } })
    if (row) {
      return {
        enabled: row.enabled,
        intervalHours: row.intervalHours,
        autoPublishAi: row.autoPublishAi,
        minConfidence: row.minConfidence,
        maxAiPagesPerRun: row.maxAiPagesPerRun,
        geminiModel: row.geminiModel,
        saved: true,
        updatedAt: row.updatedAt,
      }
    }
  } catch {
    // table missing until the migration is applied: run with defaults
  }
  return { ...FEED_SETTINGS_DEFAULTS, saved: false, updatedAt: null }
}

export async function saveFeedSettings(patch: z.infer<typeof feedSettingsPatchSchema>, userId: string): Promise<FeedSettings> {
  await prisma.privateFeedSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...FEED_SETTINGS_DEFAULTS, ...patch, updatedById: userId },
    update: { ...patch, updatedById: userId },
  })
  return getFeedSettings()
}
