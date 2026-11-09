import { Suspense } from "react"
import type { Metadata } from "next"
import { PrivateJobsClient } from "../private-jobs-client"

export const metadata: Metadata = {
  title: "Remote Private Jobs - Work From Home",
  description: "Remote and hybrid private jobs with trust scores, salary ranges and one-click tracking.",
}

export default function RemoteJobsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-8 text-muted-foreground">Loading remote jobs…</div>}>
      <PrivateJobsClient preset={{ remote: "REMOTE" }} />
    </Suspense>
  )
}
