import dynamic from "next/dynamic"
import { FeaturedSlider } from "@/components/home/FeaturedSlider"
import { SearchBar } from "@/components/home/SearchBar"
import { QuickLinks } from "@/components/home/QuickLinks"
import { LatestJobs } from "@/components/home/LatestJobs"
import { UpcomingDeadlines } from "@/components/home/UpcomingDeadlines"

const LatestResults = dynamic(() => import("@/components/home/LatestResults").then(m => ({ default: m.LatestResults })))
const LatestAdmitCards = dynamic(() => import("@/components/home/LatestAdmitCards").then(m => ({ default: m.LatestAdmitCards })))
const JobsByQualification = dynamic(() => import("@/components/home/JobsByQualification").then(m => ({ default: m.JobsByQualification })))
const LatestPrivateJobs = dynamic(() => import("@/components/home/LatestPrivateJobs").then(m => ({ default: m.LatestPrivateJobs })))
const PopularExams = dynamic(() => import("@/components/home/PopularExams").then(m => ({ default: m.PopularExams })))
const FAQ = dynamic(() => import("@/components/home/FAQ").then(m => ({ default: m.FAQ })))
const LatestBlog = dynamic(() => import("@/components/home/LatestBlog").then(m => ({ default: m.LatestBlog })))
const Newsletter = dynamic(() => import("@/components/layout/Newsletter").then(m => ({ default: m.Newsletter })))

export default function HomePage() {
  return (
    <>
      <FeaturedSlider />
      <SearchBar />
      <QuickLinks />
      <UpcomingDeadlines />
      <LatestJobs />
      <LatestResults />
      <LatestAdmitCards />
      <JobsByQualification />
      <LatestBlog />
      <LatestPrivateJobs />
      <PopularExams />
      <FAQ />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Newsletter />
        </div>
      </section>
    </>
  )
}