/**
 * Content-bot controls shared by the admin portal, the ingest API and the
 * scraper. Dependency-light (zod only) so the Node scraper can import it.
 *
 * Precedence for every setting: Admin → Content bot (database) > environment
 * variable > built-in default. Until a super admin saves the settings page,
 * the environment values are used, so existing deployments behave as before.
 */
import { z } from "zod"
import { isOfficialUrl } from "./normalize"
import type { SourceDef, SourceLevel } from "./types"

export interface BotSettings {
  /** Master switch - false pauses every scheduled run (manual runs still work). */
  enabled: boolean
  centralEnabled: boolean
  stateEnabled: boolean
  districtEnabled: boolean
  autoApprove: boolean
  autoApproveDailyCap: number
  minScore: number
  minConfidence: number
  maxNewPerSource: number
  maxLlmCalls: number
  /** null = use GEMINI_MODEL from the environment, else the built-in default. */
  geminiModel: string | null
}

const num = (v: string | undefined, d: number) => (v !== undefined && v !== "" && Number.isFinite(Number(v)) ? Number(v) : d)

/** Settings used before anything is saved in the admin portal. */
export function defaultSettings(env: Record<string, string | undefined> = process.env): BotSettings {
  return {
    enabled: env.INGEST_ENABLED !== "false",
    centralEnabled: true,
    stateEnabled: true,
    districtEnabled: true,
    autoApprove: env.INGEST_AUTO_APPROVE === "true",
    autoApproveDailyCap: Math.max(0, Math.floor(num(env.INGEST_AUTO_APPROVE_DAILY_CAP, 60))),
    minScore: num(env.INGEST_AUTO_APPROVE_MIN_SCORE, 75),
    minConfidence: num(env.INGEST_AUTO_APPROVE_MIN_CONFIDENCE, 0.85),
    maxNewPerSource: Math.max(1, Math.floor(num(env.INGEST_MAX_NEW_PER_SOURCE, 15))),
    maxLlmCalls: Math.max(1, Math.floor(num(env.INGEST_MAX_LLM_CALLS, 120))),
    geminiModel: null,
  }
}

export function tierEnabled(s: Pick<BotSettings, "centralEnabled" | "stateEnabled" | "districtEnabled">, level: SourceLevel): boolean {
  return level === "CENTRAL" ? s.centralEnabled : level === "STATE" ? s.stateEnabled : s.districtEnabled
}

/** Model ids look like "gemini-flash-lite-latest" or "gemini-3.5-flash". */
const MODEL_RE = /^[a-z0-9][a-z0-9.\-]{1,79}$/i

export const botSettingsPatchSchema = z
  .object({
    enabled: z.boolean(),
    centralEnabled: z.boolean(),
    stateEnabled: z.boolean(),
    districtEnabled: z.boolean(),
    autoApprove: z.boolean(),
    autoApproveDailyCap: z.number().int().min(0).max(1000),
    minScore: z.number().int().min(0).max(100),
    minConfidence: z.number().min(0).max(1),
    maxNewPerSource: z.number().int().min(1).max(100),
    maxLlmCalls: z.number().int().min(1).max(1000),
    geminiModel: z
      .string()
      .trim()
      .max(80)
      .nullable()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || MODEL_RE.test(v), "Model id may only contain letters, digits, dots and dashes"),
  })
  .partial()
  .strict()
export type BotSettingsPatch = z.infer<typeof botSettingsPatchSchema>

// ─── sources ────────────────────────────────────────────────────────

export interface SourceOverride {
  id: string
  enabled: boolean
  custom: boolean
  def?: SourceDef | null
}

/**
 * Built-in sources + admin overrides: an override switches a built-in source
 * on/off; a custom override adds a whole new source. Returns every source with
 * `disabled` set, so an explicit `--source=<id>` run can still pick a paused one.
 */
export function applySourceOverrides(fileSources: SourceDef[], overrides: SourceOverride[]): SourceDef[] {
  const byId = new Map(overrides.map((o) => [o.id, o]))
  const out = fileSources.map((s) => {
    const o = byId.get(s.id)
    return o && !o.custom ? { ...s, disabled: !o.enabled } : s
  })
  const known = new Set(out.map((s) => s.id))
  for (const o of overrides) {
    if (!o.custom || !o.def || known.has(o.id)) continue
    const parsed = customSourceSchema.safeParse(o.def)
    if (parsed.success) out.push({ ...parsed.data, id: o.id, disabled: !o.enabled })
  }
  return out
}

export function slugifySourceName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
}

export function customSourceId(name: string): string {
  return `custom:${slugifySourceName(name) || "source"}`
}

const hostList = z
  .array(z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "Host must look like example.org"))
  .max(10)

/** A source a super admin adds from the portal. */
export const customSourceSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    level: z.enum(["CENTRAL", "STATE", "DISTRICT"]),
    adapter: z.enum(["html-links", "nic-s3waas"]).default("html-links"),
    url: z.url({ protocol: /^https?$/ }),
    extraUrls: z.array(z.url({ protocol: /^https?$/ })).max(5).optional(),
    state: z.string().trim().max(100).optional(),
    district: z.string().trim().max(100).optional(),
    department: z.string().trim().max(200).optional(),
    scope: z.string().trim().max(200).optional(),
    include: z
      .string()
      .trim()
      .max(200)
      .optional()
      .refine((v) => {
        if (!v) return true
        try {
          new RegExp(v, "i")
          return true
        } catch {
          return false
        }
      }, "Link pattern is not a valid regular expression"),
    allowHosts: hostList.optional(),
  })
  .superRefine((s, ctx) => {
    if (s.level !== "CENTRAL" && !s.state) ctx.addIssue({ code: "custom", path: ["state"], message: "State is required for state and district sources" })
    if (s.level === "DISTRICT" && !s.district) ctx.addIssue({ code: "custom", path: ["district"], message: "District is required for district sources" })
    for (const [i, u] of [s.url, ...(s.extraUrls ?? [])].entries()) {
      if (!isOfficialUrl(u, s.allowHosts)) {
        ctx.addIssue({
          code: "custom",
          path: i === 0 ? ["url"] : ["extraUrls", i - 1],
          message: "Only official sites (.gov.in, .nic.in, .ac.in …) are allowed - add the host to 'Allowed hosts' if this board really uses another domain",
        })
      }
    }
  })
  .transform((s) => ({
    ...s,
    // Drop empty strings so they don't override defaults.
    state: s.state || undefined,
    district: s.district || undefined,
    department: s.department || undefined,
    scope: s.scope || undefined,
    include: s.include || undefined,
  }))
export type CustomSourceInput = z.input<typeof customSourceSchema>

/** What GET /api/cron/ingest/config returns to the scraper. */
export interface BotRuntimeConfig {
  settings: BotSettings
  sources: SourceOverride[]
}

// ─── manual runs ("Run now") ────────────────────────────────────────

export const runRequestSchema = z
  .object({
    tier: z.enum(["central", "state", "district", "all"]).optional(),
    source: z.string().trim().min(1).max(120).regex(/^[\w:./-]+$/).optional(),
    dryRun: z.boolean().default(false),
  })
  .refine((r) => r.tier || r.source, "Pick a tier or a source")

/** Inputs for the content-ingest workflow_dispatch. */
export function workflowInputs(r: z.infer<typeof runRequestSchema>, target: "dev" | "production"): Record<string, string> {
  return {
    target,
    tier: r.tier ?? "central",
    source: r.source ?? "",
    dry_run: String(r.dryRun),
  }
}
