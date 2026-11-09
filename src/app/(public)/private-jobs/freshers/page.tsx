import { Suspense } from "react"
import type { Metadata } from "next"
import { PrivateJobsClient } from "../private-jobs-client"

export const metadata: Metadata = {
  title: "Fresher Private Jobs - 0-2 Years, Internships",
  description: "Fresher-friendly private jobs and internships with prep kits and resume match.",
}

export default function FresherJobsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-8 text-muted-foreground">Loading fresher jobs…</div>}>
      <PrivateJobsClient preset={{ fresher: "1" }} />
    </Suspense>
  )
}
