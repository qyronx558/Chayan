// Shared search constants - single source of truth for popular searches.
// Imported by SearchDialog (modal) and homepage SearchBar (hero) so both stay in sync.

export const POPULAR_SEARCHES = [
  "SSC CGL 2024",
  "UPSC Civil Services",
  "IBPS PO",
  "RRB NTPC",
  "State PSC",
  "Bank Clerk",
  "Railway Group D",
  "Defence Jobs",
  "Teaching Jobs",
  "Engineering Jobs",
  "Nursing Jobs",
  "Police Constable",
] as const

// Short subset shown in the homepage hero to avoid overwhelming users.
export const HERO_TRENDING_SEARCHES: readonly string[] = POPULAR_SEARCHES.slice(0, 5)

export const OPEN_SEARCH_EVENT = "chayan:open-search"

export function requestOpenSearch(query = "") {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<string>(OPEN_SEARCH_EVENT, { detail: query })
  )
}
