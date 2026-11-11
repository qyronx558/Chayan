import { describe, expect, it, vi } from "vitest"
import { CALENDAR_TYPE_STYLES } from "@/lib/calendar"
import { FEATURED_TYPE_BADGES, FEATURED_TYPE_ICONS, FEATURED_TYPE_LABELS } from "@/lib/featured"
import { HERO_TRENDING_SEARCHES, OPEN_SEARCH_EVENT, POPULAR_SEARCHES, requestOpenSearch } from "@/lib/search-constants"
import { INDIAN_STATES_28 } from "@/lib/states"

// Data-only modules: guard against accidental edits that break the UI.
describe("static data tables", () => {
  it("lists exactly 28 unique, sorted states", () => {
    expect(INDIAN_STATES_28).toHaveLength(28)
    expect(new Set(INDIAN_STATES_28).size).toBe(28)
    expect([...INDIAN_STATES_28].sort()).toEqual([...INDIAN_STATES_28])
  })

  it("has a label, badge and icon for every featured type", () => {
    const keys = Object.keys(FEATURED_TYPE_LABELS).sort()
    expect(Object.keys(FEATURED_TYPE_BADGES).sort()).toEqual(keys)
    expect(Object.keys(FEATURED_TYPE_ICONS).sort()).toEqual(keys)
  })

  it("has full styles for each calendar event type", () => {
    for (const style of Object.values(CALENDAR_TYPE_STYLES)) {
      expect(style.dot && style.badge && style.pill && style.label).toBeTruthy()
    }
  })

  it("hero searches are the first five popular searches", () => {
    expect(HERO_TRENDING_SEARCHES).toEqual(POPULAR_SEARCHES.slice(0, 5))
  })
})

describe("requestOpenSearch", () => {
  it("does nothing on the server", () => {
    expect(() => requestOpenSearch("x")).not.toThrow()
  })

  it("dispatches the open-search event in the browser", () => {
    const dispatchEvent = vi.fn()
    vi.stubGlobal("window", { dispatchEvent })
    requestOpenSearch("ssc")
    const event = dispatchEvent.mock.calls[0][0] as CustomEvent<string>
    expect(event.type).toBe(OPEN_SEARCH_EVENT)
    expect(event.detail).toBe("ssc")
  })
})
