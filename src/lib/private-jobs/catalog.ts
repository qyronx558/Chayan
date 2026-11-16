import type { FeedProvider } from "@/lib/private-jobs/feeds"
import { GLOBAL_BOARDS } from "@/lib/private-jobs/global-catalog"

/**
 * Well-known employers whose official job boards are public and that were
 * verified to list openings in India (checked 2026-11-16). Super admins add
 * them in one click from Admin → Job feeds → Catalog; each board is re-checked
 * on its first sync, and a board that disappears simply shows an error there.
 */
export interface CatalogEntry {
  id: string
  company: string
  website: string | null
  provider: FeedProvider
  token: string
  sector: string
  /** Open roles when the board was verified (all locations). */
  jobs?: number
}

const CURATED: CatalogEntry[] = [
  { id: "stripe", company: "Stripe", website: "https://stripe.com", provider: "GREENHOUSE", token: "stripe", sector: "Fintech" },
  { id: "razorpay", company: "Razorpay", website: "https://razorpay.com", provider: "GREENHOUSE", token: "razorpaysoftwareprivatelimited", sector: "Fintech" },
  { id: "coinbase", company: "Coinbase", website: "https://coinbase.com", provider: "GREENHOUSE", token: "coinbase", sector: "Fintech" },
  { id: "groww", company: "Groww", website: "https://groww.in", provider: "GREENHOUSE", token: "groww", sector: "Fintech" },
  { id: "cred", company: "CRED", website: "https://cred.club", provider: "LEVER", token: "cred", sector: "Fintech" },
  { id: "slice", company: "slice", website: "https://sliceit.com", provider: "GREENHOUSE", token: "slice", sector: "Fintech" },
  { id: "fi", company: "Fi Money", website: "https://fi.money", provider: "LEVER", token: "fi", sector: "Fintech" },
  { id: "databricks", company: "Databricks", website: "https://databricks.com", provider: "GREENHOUSE", token: "databricks", sector: "Data & AI" },
  { id: "mongodb", company: "MongoDB", website: "https://mongodb.com", provider: "GREENHOUSE", token: "mongodb", sector: "Data & AI" },
  { id: "elastic", company: "Elastic", website: "https://elastic.co", provider: "GREENHOUSE", token: "elastic", sector: "Data & AI" },
  { id: "atlan", company: "Atlan", website: "https://atlan.com", provider: "ASHBY", token: "atlan", sector: "Data & AI" },
  { id: "rubrik", company: "Rubrik", website: "https://rubrik.com", provider: "GREENHOUSE", token: "rubrik", sector: "Security" },
  { id: "okta", company: "Okta", website: "https://okta.com", provider: "GREENHOUSE", token: "okta", sector: "Security" },
  { id: "druva", company: "Druva", website: "https://druva.com", provider: "GREENHOUSE", token: "druva", sector: "Security" },
  { id: "twilio", company: "Twilio", website: "https://twilio.com", provider: "GREENHOUSE", token: "twilio", sector: "SaaS & Cloud" },
  { id: "sumologic", company: "Sumo Logic", website: "https://sumologic.com", provider: "GREENHOUSE", token: "sumologic", sector: "SaaS & Cloud" },
  { id: "mindtickle", company: "Mindtickle", website: "https://mindtickle.com", provider: "LEVER", token: "mindtickle", sector: "SaaS & Cloud" },
  { id: "spotdraft", company: "SpotDraft", website: "https://spotdraft.com", provider: "ASHBY", token: "spotdraft", sector: "SaaS & Cloud" },
  { id: "notion", company: "Notion", website: "https://notion.so", provider: "ASHBY", token: "notion", sector: "SaaS & Cloud" },
  { id: "gitlab", company: "GitLab", website: "https://gitlab.com", provider: "GREENHOUSE", token: "gitlab", sector: "Developer tools" },
  { id: "figma", company: "Figma", website: "https://figma.com", provider: "GREENHOUSE", token: "figma", sector: "Developer tools" },
  { id: "airbnb", company: "Airbnb", website: "https://airbnb.com", provider: "GREENHOUSE", token: "airbnb", sector: "Consumer Internet" },
  { id: "meesho", company: "Meesho", website: "https://meesho.com", provider: "LEVER", token: "meesho", sector: "Consumer Internet" },
  { id: "inmobi", company: "InMobi", website: "https://inmobi.com", provider: "GREENHOUSE", token: "inmobi", sector: "Consumer Internet" },
  { id: "glance", company: "Glance", website: "https://glance.com", provider: "GREENHOUSE", token: "glance", sector: "Consumer Internet" },
  { id: "pocketfm", company: "Pocket FM", website: "https://pocketfm.com", provider: "LEVER", token: "pocketfm", sector: "Consumer Internet" },
  { id: "tekion", company: "Tekion", website: "https://tekion.com", provider: "ASHBY", token: "tekion", sector: "Mobility & Auto" },
]

/**
 * Curated boards first, then the worldwide boards found by job-board discovery
 * (src/lib/private-jobs/global-catalog.ts, regenerated with
 * `npx tsx scripts/discover-job-boards.ts`). Duplicate boards are dropped.
 */
export const COMPANY_CATALOG: CatalogEntry[] = (() => {
  const seen = new Set<string>()
  const out: CatalogEntry[] = []
  for (const e of [...CURATED, ...GLOBAL_BOARDS]) {
    const key = `${e.provider}:${e.token.toLowerCase()}`
    if (seen.has(key) || out.some((o) => o.id === e.id)) continue
    seen.add(key)
    out.push(e)
  }
  return out
})()
