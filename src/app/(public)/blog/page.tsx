import type { Metadata } from "next"
import { BlogClient } from "./blog-client"
import { DataVersionProvider } from "@/components/providers/DataVersion"
import { renderVersion } from "@/lib/data-version"

export const metadata: Metadata = {
  title: "Blog - Career Guides, Exam Tips & Job Updates",
  description: "Practical career guides, exam preparation strategies, AI & money skills and latest government job updates on the ChayanJobs Blog.",
  keywords: ["career guidance", "exam preparation", "government jobs", "study tips", "AI skills"],
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://chayanjobs.com"}/blog` },
  openGraph: {
    title: "ChayanJobs Blog - Career Guides & Exam Prep",
    description: "Practical guides on careers, exams, AI, money and productivity.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Blog | ChayanJobs", description: "Exam tips, preparation guides & job updates." },
}

export const revalidate = 86400

export default function BlogPage() {
  return (
    <DataVersionProvider version={renderVersion()}>
      <BlogClient />
    </DataVersionProvider>
  )
}
