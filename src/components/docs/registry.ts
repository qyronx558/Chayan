import type { DocArticle, DocGroupId, DocMeta } from "./types"
import * as introduction from "./articles/introduction"
import * as ourStory from "./articles/our-story"
import * as quickStart from "./articles/quick-start"
import * as findingYourWay from "./articles/finding-your-way"
import * as governmentJobs from "./articles/government-jobs"
import * as resultsAdmitCards from "./articles/results-admit-cards-answer-keys"
import * as syllabusCalendar from "./articles/syllabus-admissions-calendar"
import * as privateJobs from "./articles/private-jobs"
import * as search from "./articles/search"
import * as viewer from "./articles/official-site-viewer"
import * as tracker from "./articles/application-tracker"
import * as freeTools from "./articles/free-tools"
import * as account from "./articles/account-and-sign-in"
import * as profile from "./articles/profile-and-settings"
import * as alerts from "./articles/alerts-and-newsletter"
import * as security from "./articles/security-and-privacy"
import * as discussions from "./articles/discussions"
import * as publishing from "./articles/how-content-is-published"
import * as employer from "./articles/employer-studio"
import * as faq from "./articles/faq"
import * as glossary from "./articles/glossary"

/** Date shown as "Last updated" on every guide. Change it when the docs are revised. */
export const DOCS_UPDATED = "2026-11-11"

export const DOC_GROUPS: { id: DocGroupId; title: string; blurb: string }[] = [
  { id: "start", title: "Start here", blurb: "What ChayanJobs is, how it began, and your first ten minutes." },
  { id: "find", title: "Find opportunities", blurb: "Jobs, results, admit cards, answer keys, syllabi and search." },
  { id: "apply", title: "Apply with confidence", blurb: "The official-site viewer, your tracker and the free tools." },
  { id: "account", title: "Your account", blurb: "Sign-in, profile, alerts, security and your data." },
  { id: "community", title: "Community", blurb: "Discussions under every post, and the blog." },
  { id: "trust", title: "How ChayanJobs works", blurb: "Where information comes from and how it is checked." },
  { id: "employers", title: "For employers", blurb: "Post jobs for free and earn for real hiring." },
  { id: "help", title: "Help", blurb: "Answers to common questions and a glossary of terms." },
]

/** Reading order. Previous / next links follow this list. */
const ARTICLES: DocArticle[] = [
  introduction,
  ourStory,
  quickStart,
  findingYourWay,
  governmentJobs,
  resultsAdmitCards,
  syllabusCalendar,
  privateJobs,
  search,
  viewer,
  tracker,
  freeTools,
  account,
  profile,
  alerts,
  security,
  discussions,
  publishing,
  employer,
  faq,
  glossary,
].map((m) => ({ meta: m.meta, Body: m.default }))

// Keep reading order consistent with group order.
const groupIndex = new Map(DOC_GROUPS.map((g, i) => [g.id, i]))
ARTICLES.sort((a, b) => (groupIndex.get(a.meta.group) ?? 0) - (groupIndex.get(b.meta.group) ?? 0))

export function allDocs(): DocArticle[] {
  return ARTICLES
}

export function getDoc(slug: string): DocArticle | undefined {
  return ARTICLES.find((a) => a.meta.slug === slug)
}

export function docsByGroup(): { id: DocGroupId; title: string; blurb: string; articles: DocMeta[] }[] {
  return DOC_GROUPS.map((g) => ({ ...g, articles: ARTICLES.filter((a) => a.meta.group === g.id).map((a) => a.meta) }))
}

export function neighbours(slug: string): { prev?: DocMeta; next?: DocMeta } {
  const i = ARTICLES.findIndex((a) => a.meta.slug === slug)
  if (i < 0) return {}
  return { prev: ARTICLES[i - 1]?.meta, next: ARTICLES[i + 1]?.meta }
}

export function groupTitle(id: DocGroupId): string {
  return DOC_GROUPS.find((g) => g.id === id)?.title ?? ""
}
