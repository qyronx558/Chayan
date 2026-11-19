import { Suspense } from "react"
import type { Metadata } from "next"
import { DataVersionProvider } from "@/components/providers/DataVersion"
import { renderVersion } from "@/lib/data-version"
import { AnswerKeysClient } from "./answer-keys-client"

export const metadata: Metadata = {
  title: "Answer Keys",
  description: "Download answer keys for government exams. Check your answers with official answer keys for various government job examinations.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://chayanjobs.com"}/answer-keys` },
  twitter: { card: "summary_large_image", title: "Answer Keys | ChayanJobs", description: "Download answer keys for government exams across India." },
}

export const revalidate = 21600

export default function AnswerKeysPage() {
  return (
    <DataVersionProvider version={renderVersion()}>
      <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-8 text-muted-foreground">Loading answer keys…</div>}>
        <AnswerKeysClient />
      </Suspense>
    </DataVersionProvider>
  )
}
