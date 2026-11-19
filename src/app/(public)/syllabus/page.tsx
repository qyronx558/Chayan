import { Suspense } from "react"
import type { Metadata } from "next"
import { DataVersionProvider } from "@/components/providers/DataVersion"
import { renderVersion } from "@/lib/data-version"
import { SyllabusClient } from "./syllabus-client"

export const metadata: Metadata = {
  title: "Syllabus",
  description: "Download syllabus for government exams. Get detailed subject-wise syllabus for various government job examinations across India.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://chayanjobs.com"}/syllabus` },
  twitter: { card: "summary_large_image", title: "Syllabus | ChayanJobs", description: "Download subject-wise syllabus for government exams." },
}

export const revalidate = 21600

export default function SyllabusPage() {
  return (
    <DataVersionProvider version={renderVersion()}>
      <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-8 text-muted-foreground">Loading syllabus…</div>}>
        <SyllabusClient />
      </Suspense>
    </DataVersionProvider>
  )
}
