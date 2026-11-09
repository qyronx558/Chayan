import { Suspense } from "react"
import type { Metadata } from "next"
import { PrivateJobsClient } from "../private-jobs-client"

export const metadata: Metadata = {
  title: "Walk-in Interviews - Private Jobs",
  description: "Walk-in private jobs with venue and date, trust-checked.",
}

export default function WalkinJobsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-8 text-muted-foreground">Loading walk-in jobs…</div>}>
      <PrivateJobsClient preset={{ walkin: "1" }} />
    </Suspense>
  )
}
