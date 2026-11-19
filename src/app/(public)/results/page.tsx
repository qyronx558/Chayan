import { Suspense } from "react"
import type { Metadata } from "next"
import { DataVersionProvider } from "@/components/providers/DataVersion"
import { renderVersion } from "@/lib/data-version"
import { ResultsClient } from "./results-client"

export const metadata: Metadata = {
  title: "Exam Results",
  description: "Check latest government exam results. Download PDF result notifications for various government job exams across India.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://chayanjobs.com"}/results` },
  twitter: { card: "summary_large_image", title: "Exam Results | ChayanJobs", description: "Check latest government exam results across India." },
}

export const revalidate = 21600

export default function ResultsPage() {
  return (
    <DataVersionProvider version={renderVersion()}>
      <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-8 text-muted-foreground">Loading results…</div>}>
        <ResultsClient />
      </Suspense>
    </DataVersionProvider>
  )
}
