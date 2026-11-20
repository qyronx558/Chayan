import { Suspense } from "react"
import type { Metadata } from "next"
import { DataVersionProvider } from "@/components/providers/DataVersion"
import { renderVersion } from "@/lib/data-version"
import { PrivateJobsClient } from "./private-jobs-client"

export const metadata: Metadata = {
  title: "Private Jobs",
  description: "Browse private job vacancies including full-time, part-time, internships, and contract positions across top companies.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://chayanjobs.com"}/private-jobs` },
  twitter: { card: "summary_large_image", title: "Private Jobs | ChayanJobs", description: "Browse private job vacancies across top companies." },
}

// Backstop only: the feed sync (every 3h) revalidates these on demand when data changes.
export const revalidate = 21600

export default function PrivateJobsPage() {
  return (
    <DataVersionProvider version={renderVersion()}>
      <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-8 text-muted-foreground">Loading private jobs…</div>}>
        <PrivateJobsClient />
      </Suspense>
    </DataVersionProvider>
  )
}
