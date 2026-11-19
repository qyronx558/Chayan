import Link from "next/link"
import type { Metadata } from "next"
import { MapPin } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getBaseUrl, safeJsonLd } from "@/lib/utils"
import { statePagePath } from "@/lib/locations"
import { getStateJobCounts } from "@/lib/location-pages"
import { Card, CardContent } from "@/components/ui/card"
import { Breadcrumb } from "@/components/ui/breadcrumb"

export const revalidate = 21600

const TITLE = "Government Jobs by State & Union Territory — Chayan Jobs"
const DESCRIPTION =
  "Find state government and district-level jobs in all 28 states and 8 union territories of India, plus central government jobs open to everyone."

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${getBaseUrl()}/jobs/states` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${getBaseUrl()}/jobs/states` },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
}

async function getData() {
  try {
    const [states, counts] = await Promise.all([
      prisma.state.findMany({
        where: { districts: { some: {} } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, type: true, _count: { select: { districts: true } } },
      }),
      getStateJobCounts(),
    ])
    return { states, counts }
  } catch (error) {
    // DB unavailable at build time: render an empty shell, ISR fills it in.
    console.error("[jobs/states] failed to load states:", error)
    return { states: [], counts: { byState: new Map<string, number>(), central: 0 } }
  }
}

export default async function StatesIndexPage() {
  const { states, counts } = await getData()
  const groups = [
    { title: "States", items: states.filter((s) => s.type === "STATE") },
    { title: "Union Territories", items: states.filter((s) => s.type === "UNION_TERRITORY") },
  ]

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: getBaseUrl() },
      { "@type": "ListItem", position: 2, name: "Jobs", item: `${getBaseUrl()}/jobs` },
      { "@type": "ListItem", position: 3, name: "By state", item: `${getBaseUrl()}/jobs/states` },
    ],
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      <Breadcrumb className="mb-4" segments={[{ label: "Jobs", href: "/jobs" }, { label: "By state", href: "/jobs/states" }]} />
      <h1 className="mb-2 text-3xl font-bold text-foreground">Government Jobs by State</h1>
      <p className="mb-8 max-w-3xl text-muted-foreground">
        Pick your state or union territory to see the state and district jobs you can apply for, together with{" "}
        <Link href="/jobs?level=central" className="text-brick underline-offset-2 hover:underline">
          {counts.central} central government jobs
        </Link>{" "}
        open to candidates from anywhere in India.
      </p>

      {states.length === 0 ? (
        <p className="text-muted-foreground">State listings are being prepared. Please check back shortly.</p>
      ) : (
        groups.map((group) =>
          group.items.length ? (
            <section key={group.title} className="mb-10" aria-labelledby={`h-${group.title}`}>
              <h2 id={`h-${group.title}`} className="mb-4 text-xl font-semibold text-foreground">
                {group.title} <span className="text-muted-foreground">({group.items.length})</span>
              </h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.items.map((s) => {
                  const jobs = counts.byState.get(s.id) ?? 0
                  return (
                    <li key={s.id}>
                      <Link href={statePagePath(s.slug)} className="block h-full">
                        <Card className="h-full transition-colors hover:border-brick">
                          <CardContent className="flex items-start gap-3 p-4">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brick" aria-hidden />
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">{s.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {s._count.districts} {s._count.districts === 1 ? "district" : "districts"} ·{" "}
                                {jobs} active {jobs === 1 ? "job" : "jobs"}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null
        )
      )}
    </div>
  )
}
