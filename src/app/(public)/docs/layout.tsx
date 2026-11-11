import type { ReactNode } from "react"
import { DocsSidebar } from "@/components/docs/DocsSidebar"
import { docsByGroup } from "@/components/docs/registry"

export default function DocsLayout({ children }: { children: ReactNode }) {
  const groups = docsByGroup().map((g) => ({
    id: g.id,
    title: g.title,
    articles: g.articles.map((a) => ({ slug: a.slug, title: a.title, description: a.description })),
  }))

  return (
    <div className="container-site py-6 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <DocsSidebar groups={groups} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
