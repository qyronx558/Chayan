import { Suspense } from "react"
import type { Metadata } from "next"
import { BrowseClient } from "./browse-client"

export const metadata: Metadata = {
  title: "ChayanJobs Browser",
  description: "Viewing the official website inside ChayanJobs in-app browser.",
  robots: { index: false, follow: false },
}

export default function BrowsePage() {
  return (
    <Suspense fallback={null}>
      <BrowseClient />
    </Suspense>
  )
}
