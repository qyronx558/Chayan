import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchClient } from "./search-client"

export const metadata: Metadata = {
  title: "Search Jobs, Results, Admit Cards & Blogs",
  description:
    "Universal search across government jobs, private jobs, results, admit cards, answer keys and blogs. Type to get recommendations.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://chayanjobs.com"}/search`,
  },
  robots: { index: false, follow: true },
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchClient />
    </Suspense>
  )
}
