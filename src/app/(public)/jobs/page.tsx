import { Suspense } from "react"
import type { Metadata } from "next"
import { JobsClient } from "./jobs-client"

export const metadata: Metadata = {
  title: "Latest Government Jobs",
  description: "Browse latest government job notifications across India. Filter by category, department, state, and status to find your dream government job.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://chayanjobs.com"}/jobs` },
  twitter: { card: "summary_large_image", title: "Latest Government Jobs | ChayanJobs", description: "Browse latest government job notifications across India." },
}

export const revalidate = 300

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-8 text-muted-foreground">Loading jobs…</div>}>
      <JobsClient />
    </Suspense>
  )
}
