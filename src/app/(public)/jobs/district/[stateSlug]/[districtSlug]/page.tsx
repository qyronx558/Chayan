import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getBaseUrl, safeJsonLd } from "@/lib/utils"
import { districtPagePath, statePagePath } from "@/lib/locations"
import { getDistrictBySlugs } from "@/lib/location-pages"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { JobsClient } from "../../../jobs-client"
import { DataVersionProvider } from "@/components/providers/DataVersion"
import { renderVersion } from "@/lib/data-version"

export const revalidate = 21600

export function generateStaticParams(): Record<string, string>[] {
  return []
}

type Props = { params: Promise<{ stateSlug: string; districtSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stateSlug, districtSlug } = await params
  const district = await getDistrictBySlugs(stateSlug, districtSlug)
  if (!district) return { title: "District not found" }
  const { state } = district
  const title = `Government Jobs in ${district.name}, ${state.name} — Chayan Jobs`
  const description = `Latest government jobs for ${district.name} district, ${state.name}: district-level vacancies (Zilla Parishad, Anganwadi, district court and more), ${state.name} state jobs and central government jobs.`
  const url = `${getBaseUrl()}${districtPagePath(state.slug, district.slug)}`
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function DistrictJobsPage({ params }: Props) {
  const { stateSlug, districtSlug } = await params
  const district = await getDistrictBySlugs(stateSlug, districtSlug)
  if (!district) notFound()
  const { state } = district

  const base = getBaseUrl()
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Jobs by state", item: `${base}/jobs/states` },
      { "@type": "ListItem", position: 3, name: state.name, item: `${base}${statePagePath(state.slug)}` },
      { "@type": "ListItem", position: 4, name: district.name, item: `${base}${districtPagePath(state.slug, district.slug)}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      <div className="container mx-auto max-w-7xl px-4 pt-6">
        <Breadcrumb
          segments={[
            { label: "Jobs by state", href: "/jobs/states" },
            { label: state.name, href: statePagePath(state.slug) },
            { label: district.name, href: districtPagePath(state.slug, district.slug) },
          ]}
        />
      </div>

      <DataVersionProvider version={renderVersion()}>
        <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-8 text-muted-foreground">Loading jobs…</div>}>
          <JobsClient
            preset={{
              eligibleState: state.slug,
              eligibleDistrict: district.slug,
              heading: `Government Jobs in ${district.name}, ${state.name}`,
              intro: `Jobs open to candidates from ${district.name}: district-level vacancies, ${state.name} state jobs, and central government jobs open to all of India.`,
            }}
          />
        </Suspense>
      </DataVersionProvider>

      <div className="container mx-auto max-w-7xl px-4 pb-12">
        <Link href={statePagePath(state.slug)} className="text-sm text-brick underline-offset-2 hover:underline">
          ← All districts in {state.name}
        </Link>
      </div>
    </>
  )
}
