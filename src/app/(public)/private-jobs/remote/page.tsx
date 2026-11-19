import { Suspense } from "react"
import type { Metadata } from "next"
import { DataVersionProvider } from "@/components/providers/DataVersion"
import { renderVersion } from "@/lib/data-version"
import { PrivateJobsClient } from "../private-jobs-client"

export const metadata: Metadata = {
  title: "Remote Private Jobs - Work From Home",
  description: "Remote and hybrid private jobs with trust scores, salary ranges and one-click tracking.",
}

export const revalidate = 3600

export default function RemoteJobsPage() {
  return (
    <DataVersionProvider version={renderVersion()}>
      <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-8 text-muted-foreground">Loading remote jobs…</div>}>
        <PrivateJobsClient preset={{ remote: "REMOTE" }} />
      </Suspense>
    </DataVersionProvider>
  )
}
