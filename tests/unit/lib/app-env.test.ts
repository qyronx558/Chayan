import { beforeEach, describe, expect, it, vi } from "vitest"
import { APP_ENVS, ENV_LABELS, getAppEnv, isProduction } from "@/lib/app-env"

beforeEach(() => {
  for (const key of ["NEXT_PUBLIC_APP_ENV", "NEXT_PUBLIC_VERCEL_ENV", "VERCEL_ENV"]) vi.stubEnv(key, "")
  vi.stubEnv("NODE_ENV", "test")
})

describe("getAppEnv", () => {
  it("uses the explicit NEXT_PUBLIC_APP_ENV first", () => {
    vi.stubEnv("VERCEL_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "dev")
    expect(getAppEnv()).toBe("dev")
  })

  it("ignores unknown explicit values", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "staging")
    expect(getAppEnv()).toBe("local")
  })

  it.each([
    ["production", "production"],
    ["preview", "dev"],
    ["development", "local"],
  ] as const)("maps VERCEL_ENV=%s to %s", (vercel, expected) => {
    vi.stubEnv("VERCEL_ENV", vercel)
    expect(getAppEnv()).toBe(expected)
  })

  it("reads the browser-exposed Vercel variable too", () => {
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview")
    expect(getAppEnv()).toBe("dev")
  })

  it("treats self-hosted production builds as production and everything else as local", () => {
    vi.stubEnv("NODE_ENV", "production")
    expect(getAppEnv()).toBe("production")
    expect(isProduction()).toBe(true)
    vi.stubEnv("NODE_ENV", "development")
    expect(getAppEnv()).toBe("local")
    expect(isProduction()).toBe(false)
  })
})

describe("labels", () => {
  it("has a label for every environment", () => {
    for (const env of APP_ENVS) expect(ENV_LABELS[env].name).toBeTruthy()
    expect(ENV_LABELS.dev.note).toMatch(/not the live website/)
  })
})
