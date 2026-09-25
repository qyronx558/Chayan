// Shared universal-search helpers used by the hero SearchBar (own inline
// dropdown) and the dedicated /search recommended page. Header SearchDialog
// keeps its own internal copy to avoid touching its keyboard/modal logic.

export type UniversalSearchType =
  | "job"
  | "private_job"
  | "result"
  | "admit_card"
  | "answer_key"
  | "blog"

export interface UniversalSearchItem {
  id: string
  title: string
  type: UniversalSearchType
  slug: string
  subtitle?: string
}

export const UNIVERSAL_TYPE_META: Record<
  UniversalSearchType,
  { label: string; href: string }
> = {
  job: { label: "Govt Jobs", href: "/apply" },
  private_job: { label: "Private Jobs", href: "/private-jobs" },
  result: { label: "Results", href: "/result" },
  admit_card: { label: "Admit Cards", href: "/admit-card" },
  answer_key: { label: "Answer Keys", href: "/answer-key" },
  blog: { label: "Blogs", href: "/blog" },
}

export function universalItemUrl(item: UniversalSearchItem): string {
  return `${UNIVERSAL_TYPE_META[item.type].href}/${item.slug}`
}

export function mapSearchApiToItems(json: any): UniversalSearchItem[] {
  const items: UniversalSearchItem[] = []
  const data = json?.data
  if (!data) return items
  if (Array.isArray(data.jobs)) {
    for (const j of data.jobs) {
      items.push({
        id: String(j.id),
        title: String(j.title),
        type: "job",
        slug: String(j.slug),
        subtitle: j.department?.name,
      })
    }
  }
  if (Array.isArray(data.privateJobs)) {
    for (const j of data.privateJobs) {
      items.push({
        id: String(j.id),
        title: String(j.title),
        type: "private_job",
        slug: String(j.slug),
        subtitle: j.company?.name,
      })
    }
  }
  if (Array.isArray(data.results)) {
    for (const r of data.results) {
      items.push({
        id: String(r.id),
        title: String(r.title),
        type: "result",
        slug: String(r.slug),
        subtitle: r.department?.name,
      })
    }
  }
  if (Array.isArray(data.admitCards)) {
    for (const a of data.admitCards) {
      items.push({
        id: String(a.id),
        title: String(a.title),
        type: "admit_card",
        slug: String(a.slug),
        subtitle: a.department?.name,
      })
    }
  }
  if (Array.isArray(data.answerKeys)) {
    for (const a of data.answerKeys) {
      items.push({
        id: String(a.id),
        title: String(a.title),
        type: "answer_key",
        slug: String(a.slug),
        subtitle: a.department?.name,
      })
    }
  }
  if (Array.isArray(data.blogs)) {
    for (const b of data.blogs) {
      items.push({
        id: String(b.id),
        title: String(b.title),
        type: "blog",
        slug: String(b.slug),
        subtitle: b.category?.name,
      })
    }
  }
  return items
}

export function groupUniversalItems(items: UniversalSearchItem[]) {
  const groups = new Map<UniversalSearchType, UniversalSearchItem[]>()
  for (const item of items) {
    const list = groups.get(item.type) ?? []
    list.push(item)
    groups.set(item.type, list)
  }
  return [...groups.entries()]
}
