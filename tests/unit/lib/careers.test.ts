import { describe, expect, it, vi } from "vitest"

async function load(embed?: string) {
  vi.resetModules()
  vi.stubEnv("NEXT_PUBLIC_CAREERS_FORM_EMBED_URL", embed ?? "")
  return import("@/lib/careers")
}

describe("getCareersEmbedUrl", () => {
  it("is empty until a real Google Form is configured", async () => {
    const { getCareersEmbedUrl, careersFormConfig } = await load()
    expect(careersFormConfig.isConfigured).toBe(false)
    expect(getCareersEmbedUrl()).toBe("")
  })

  it("adds embedded=true to a share link", async () => {
    const { getCareersEmbedUrl } = await load("https://docs.google.com/forms/d/e/ABC/viewform")
    expect(getCareersEmbedUrl()).toBe("https://docs.google.com/forms/d/e/ABC/viewform?embedded=true")
  })

  it("appends to an existing query string or keeps an embed link", async () => {
    expect((await load("https://docs.google.com/forms/d/e/ABC/viewform?usp=sf_link")).getCareersEmbedUrl()).toBe(
      "https://docs.google.com/forms/d/e/ABC/viewform?usp=sf_link&embedded=true",
    )
    expect((await load("https://docs.google.com/forms/d/e/ABC/viewform?embedded=true")).getCareersEmbedUrl()).toBe(
      "https://docs.google.com/forms/d/e/ABC/viewform?embedded=true",
    )
  })

  it("rejects non-Google-Forms links", async () => {
    expect((await load("https://evil.example/forms/d/e/x")).getCareersEmbedUrl()).toBe("")
  })

  it("ships open roles, perks and hiring steps", async () => {
    const { openRoles, perks, hiringSteps } = await load()
    expect(openRoles.length).toBeGreaterThan(0)
    expect(perks.length).toBeGreaterThan(0)
    expect(hiringSteps.length).toBeGreaterThan(0)
  })
})
