import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { EnvironmentBanner } from "@/components/layout/EnvironmentBanner"

describe("EnvironmentBanner", () => {
  it("shows nothing on the live site", () => {
    expect(renderToStaticMarkup(<EnvironmentBanner env="production" />)).toBe("")
  })

  it("clearly marks the dev site", () => {
    const html = renderToStaticMarkup(<EnvironmentBanner env="dev" />)
    expect(html).toContain('data-app-env="dev"')
    expect(html).toContain("DEV")
    expect(html).toContain("not the live website")
  })

  it("clearly marks a local copy", () => {
    const html = renderToStaticMarkup(<EnvironmentBanner env="local" />)
    expect(html).toContain("LOCAL")
    expect(html).toContain("this computer only")
  })
})
