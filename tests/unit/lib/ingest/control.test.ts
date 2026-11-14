import { describe, expect, it } from "vitest"
import {
  applySourceOverrides,
  botSettingsPatchSchema,
  customSourceId,
  customSourceSchema,
  defaultSettings,
  runRequestSchema,
  tierEnabled,
  workflowInputs,
} from "@/lib/ingest/control"
import { dispatchConfig } from "@/lib/ingest/dispatch"
import { autoApproveFromSettings } from "@/lib/ingest/policy"
import type { SourceDef } from "@/lib/ingest/types"

const FILE: SourceDef[] = [
  { id: "bpsc", name: "BPSC", level: "STATE", adapter: "html-links", url: "https://bpsc.bihar.gov.in/", state: "Bihar" },
  { id: "nic:bihar/patna", name: "Patna", level: "DISTRICT", adapter: "nic-s3waas", url: "https://patna.nic.in/notice_category/recruitment/", state: "Bihar", district: "Patna" },
]
const custom = { name: "Maharashtra PSC", level: "STATE", url: "https://mpsc.gov.in/adv", state: "Maharashtra", include: "[.]pdf" }

describe("defaultSettings", () => {
  it("keeps the old environment behaviour until an admin saves", () => {
    expect(defaultSettings({})).toMatchObject({ enabled: true, autoApprove: false, autoApproveDailyCap: 60, maxNewPerSource: 15, maxLlmCalls: 120, geminiModel: null })
    expect(defaultSettings({ INGEST_AUTO_APPROVE: "true", INGEST_AUTO_APPROVE_DAILY_CAP: "5", INGEST_MAX_LLM_CALLS: "30", INGEST_ENABLED: "false" })).toMatchObject({
      enabled: false, autoApprove: true, autoApproveDailyCap: 5, maxLlmCalls: 30,
    })
  })
  it("maps settings to the auto-approve policy and tiers", () => {
    const s = { ...defaultSettings({}), autoApprove: true, minScore: 80, stateEnabled: false }
    expect(autoApproveFromSettings(s)).toEqual({ enabled: true, dailyCap: 60, minScore: 80, minConfidence: 0.85 })
    expect(tierEnabled(s, "STATE")).toBe(false)
    expect(tierEnabled(s, "DISTRICT")).toBe(true)
  })
})

describe("botSettingsPatchSchema", () => {
  it("accepts partial patches and blank model = environment", () => {
    expect(botSettingsPatchSchema.parse({ enabled: false })).toEqual({ enabled: false })
    expect(botSettingsPatchSchema.parse({ geminiModel: "  " }).geminiModel).toBeNull()
    expect(botSettingsPatchSchema.parse({ geminiModel: "gemini-3.5-flash-lite" }).geminiModel).toBe("gemini-3.5-flash-lite")
  })
  it("rejects bad values and unknown keys", () => {
    expect(botSettingsPatchSchema.safeParse({ minConfidence: 2 }).success).toBe(false)
    expect(botSettingsPatchSchema.safeParse({ geminiModel: "x; rm -rf" }).success).toBe(false)
    expect(botSettingsPatchSchema.safeParse({ role: "ADMIN" }).success).toBe(false)
  })
})

describe("sources", () => {
  it("switches built-in sources off and adds custom ones", () => {
    const out = applySourceOverrides(FILE, [
      { id: "bpsc", enabled: false, custom: false },
      { id: "custom:mpsc", enabled: true, custom: true, def: { ...custom, id: "custom:mpsc" } as unknown as SourceDef },
      { id: "custom:broken", enabled: true, custom: true, def: { name: "x" } as unknown as SourceDef },
    ])
    expect(out.find((s) => s.id === "bpsc")?.disabled).toBe(true)
    expect(out.find((s) => s.id === "nic:bihar/patna")?.disabled).toBeUndefined()
    expect(out.find((s) => s.id === "custom:mpsc")).toMatchObject({ level: "STATE", adapter: "html-links", disabled: false })
    expect(out.some((s) => s.id === "custom:broken")).toBe(false)
  })
  it("only accepts official sites with a real location", () => {
    expect(customSourceSchema.safeParse(custom).success).toBe(true)
    expect(customSourceSchema.safeParse({ ...custom, url: "https://sarkariresult.com/latest" }).success).toBe(false)
    expect(customSourceSchema.safeParse({ ...custom, url: "https://ibps.in/x", allowHosts: ["ibps.in"] }).success).toBe(true)
    expect(customSourceSchema.safeParse({ ...custom, state: "" }).success).toBe(false)
    expect(customSourceSchema.safeParse({ ...custom, level: "DISTRICT" }).success).toBe(false)
    expect(customSourceSchema.safeParse({ ...custom, include: "([" }).success).toBe(false)
    expect(customSourceSchema.safeParse({ ...custom, url: "javascript:alert(1)" }).success).toBe(false)
  })
  it("builds stable custom ids", () => {
    expect(customSourceId("Maharashtra Public Service Commission")).toBe("custom:maharashtra-public-service-commission")
  })
})

describe("Run now", () => {
  it("validates the request and builds workflow inputs", () => {
    expect(runRequestSchema.safeParse({}).success).toBe(false)
    expect(runRequestSchema.safeParse({ source: "bad source; x" }).success).toBe(false)
    const r = runRequestSchema.parse({ source: "nic:bihar/patna", dryRun: true })
    expect(workflowInputs(r, "production")).toEqual({ target: "production", tier: "central", source: "nic:bihar/patna", dry_run: "true" })
  })
  it("needs a token and picks the target from the environment", () => {
    expect(dispatchConfig({})).toBeNull()
    expect(dispatchConfig({ INGEST_GITHUB_TOKEN: "t", NEXT_PUBLIC_APP_ENV: "production" })).toMatchObject({ repo: "qyronx558/Chayan", ref: "main", target: "production" })
    expect(dispatchConfig({ INGEST_GITHUB_TOKEN: "t", NEXT_PUBLIC_APP_ENV: "development" })?.target).toBe("dev")
    expect(dispatchConfig({ INGEST_GITHUB_TOKEN: "t", INGEST_DISPATCH_TARGET: "production", INGEST_GITHUB_REPO: "bad repo" })).toBeNull()
  })
})
