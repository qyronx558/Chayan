"use client"

import { useEffect } from "react"
import { notFound, useSearchParams } from "next/navigation"
import { ApplicationShell } from "@/components/apply/ApplicationShell"
import type { ApplicationInfoRow } from "@/components/apply/application-types"
import { normalizeExternalUrl, getExternalHostname } from "@/lib/apply-room"

export function BrowseClient() {
  const params = useSearchParams()
  const targetUrl = normalizeExternalUrl(params.get("url"))
  const hostname = targetUrl ? getExternalHostname(targetUrl) : ""
  const displayTitle = (params.get("title") || "").trim().slice(0, 120) || hostname
  const from = params.get("from")
  const backHref = from && from.startsWith("/") ? from : "/"

  useEffect(() => {
    if (hostname) document.title = `${displayTitle} | ChayanJobs Browser`
  }, [displayTitle, hostname])

  if (!targetUrl) notFound()

  const scopeSlug = `browse-${hostname}`
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
