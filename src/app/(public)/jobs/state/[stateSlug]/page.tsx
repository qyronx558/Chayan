import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getBaseUrl, safeJsonLd } from "@/lib/utils"
import { districtPagePath, statePagePath, STATE_TYPE_LABEL } from "@/lib/locations"
import { getDistrictJobCounts, getStateBySlug } from "@/lib/location-pages"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { JobsClient } from "../../jobs-client"
import { DataVersionProvider } from "@/components/providers/DataVersion"
import { renderVersion } from "@/lib/data-version"

export const revalidate = 21600

export function generateStaticParams(): { stateSlug: string }[] {
  return []
}

type Props = { params: Promise<{ stateSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug } = await params
  const state = await getStateBySlug(stateSlug)
  if (!state) return { title: "State not found" }
  const title = `Government Jobs in ${state.name} — Chayan Jobs`
  const description = `Latest ${state.name} government jobs: state-level recruitment for ${state.name} residents plus central government jobs open to all of India. Browse jobs in ${state.districts.length} districts.`
  const url = `${getBaseUrl()}${statePagePath(state.slug)}`
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function StateJobsPage({ params }: Props) {
  const { stateSlug } = await params
  const state = await getStateBySlug(stateSlug)
  if (!state) notFound()

  const districtJobs = await getDistrictJobCounts(state.id)
  const base = getBaseUrl()
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Jobs by state", item: `${base}/jobs/states` },
      { "@type": "ListItem", position: 3, name: state.name, item: `${base}${statePagePath(state.slug)}` },
    ],
  }
  const kind = STATE_TYPE_LABEL[state.type]?.toLowerCase() ?? "state"

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      <div className="container mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumb
          segments={[
            { label: "Jobs by state", href: "/jobs/states" },
            { label: state.name, href: statePagePath(state.slug) },
          ]}
        />
      </div>

      <DataVersionProvider version={renderVersion()}>
        <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-8 text-muted-foreground">Loading jobs…</div>}>
          <JobsClient
            preset={{
              eligibleState: state.slug,
              heading: `Government Jobs in ${state.name}`,
              intro: `Jobs open to candidates from ${state.name}: ${kind}-level recruitment plus central government jobs open to all of India. Pick a district in the filters (or from the list below) for local district-level jobs.`,
            }}
          />
        </Suspense>
      </DataVersionProvider>

      {state.districts.length > 0 && (
        <section className="container mx-auto max-w-7xl px-4 pb-12" aria-labelledby="districts-heading">
          <h2 id="districts-heading" className="mb-4 text-xl font-semibold text-foreground">
            Districts in {state.name} <span className="text-muted-foreground">({state.districts.length})</span>
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {state.districts.map((d) => {
              const n = districtJobs.get(d.id) ?? 0
              return (
                <li key={d.id}>
                  <Link
                    href={districtPagePath(state.slug, d.slug)}
                    className="flex items-center justify-between gap-2 rounded-lg border border-rule px-3 py-2 text-sm transition-colors hover:border-brick dark:border-ink"
                  >
                    <span className="truncate">{d.name}</span>
                    {n > 0 && <span className="shrink-0 text-xs text-muted-foreground">{n}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
