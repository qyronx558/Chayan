import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { FeatureGate } from "@/components/shared/FeatureGate"

describe("FeatureGate", () => {
  it("shows the feature on dev and hides it on production", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "dev")
    expect(renderToStaticMarkup(<FeatureGate name="exampleFeature">new</FeatureGate>)).toBe("new")
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production")
    expect(renderToStaticMarkup(<FeatureGate name="exampleFeature" fallback="old">new</FeatureGate>)).toBe("old")
  })
})
