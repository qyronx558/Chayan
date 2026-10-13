import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ApplicationShell } from "@/components/apply/ApplicationShell"
import type { ApplicationInfoRow } from "@/components/apply/application-types"
import { normalizeExternalUrl, getExternalHostname } from "@/lib/apply-room"

interface Props {
  searchParams: Promise<{ url?: string; title?: string; from?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { title, url } = await searchParams
  const hostname = getExternalHostname(url ?? null)
  return {
    title: title ? `${title} | ChayanJobs Browser` : `Browse ${hostname} | ChayanJobs`,
    description: "Viewing the official website inside ChayanJobs in-app browser.",
    robots: { index: false, follow: false },
  }
}

/**
 * Universal in-app browser: /browse?url=<official-url>&title=&from=
 * Every external link on ChayanJobs routes here so users never leave
 * the platform chrome. Search bar + multi-tabs live in ApplicationShell.
 */
export default async function BrowsePage({ searchParams }: Props) {
  const { url, title, from } = await searchParams
  const targetUrl = normalizeExternalUrl(url)
  if (!targetUrl) notFound()

  const hostname = getExternalHostname(targetUrl)
  const displayTitle = (title || "").trim().slice(0, 120) || hostname
  // Scope tabs per destination host so unrelated browses don't collide.
  const scopeSlug = `browse-${hostname}`
  const backHref = from && from.startsWith("/") ? from : "/"

  const infoRows: ApplicationInfoRow[] = [
    { label: "Official source", value: hostname },
    { label: "Opened from", value: backHref },
  ]

  return (
    <ApplicationShell
      type="government"
      jobId={scopeSlug}
      slug={scopeSlug}
      title={displayTitle}
      organization={hostname}
      officialUrl={targetUrl}
      hostname={hostname}
      sourceLabel="Official Source"
      backHref={backHref}
      backLabel="Back"
      infoRows={infoRows}
    />
  )
}
