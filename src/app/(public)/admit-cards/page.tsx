import { Suspense } from "react"
import type { Metadata } from "next"
import { AdmitCardsClient } from "./admit-cards-client"

export const metadata: Metadata = {
  title: "Admit Cards",
  description: "Download admit cards for upcoming government exams. Get hall tickets for various government job examinations across India.",
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://chayanjobs.com"}/admit-cards` },
  twitter: { card: "summary_large_image", title: "Admit Cards | ChayanJobs", description: "Download admit cards for upcoming government exams." },
}

export const revalidate = 300

export default function AdmitCardsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-8 text-muted-foreground">Loading admit cards…</div>}>
      <AdmitCardsClient />
    </Suspense>
  )
}
