import { describe, expect, it, vi } from "vitest"
import { APP_ENVS } from "@/lib/app-env"
import { enabledFeatures, FEATURES, isFeatureEnabled } from "@/lib/features"

describe("feature flags", () => {
  it("keeps unreleased features off in production", () => {
    expect(isFeatureEnabled("exampleFeature", "local")).toBe(true)
    expect(isFeatureEnabled("exampleFeature", "dev")).toBe(true)
    expect(isFeatureEnabled("exampleFeature", "production")).toBe(false)
  })

  it("defaults to the current environment", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production")
    expect(isFeatureEnabled("exampleFeature")).toBe(false)
    expect(enabledFeatures()).toEqual([])
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "dev")
    expect(enabledFeatures()).toContain("exampleFeature")
  })

  it("only names real environments", () => {
    for (const envs of Object.values(FEATURES)) {
      for (const env of envs) expect(APP_ENVS).toContain(env)
    }
  })
})
