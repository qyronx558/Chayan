import dynamic from "next/dynamic"
import { FeaturedSlider } from "@/components/home/FeaturedSlider"
import { SearchBar } from "@/components/home/SearchBar"
import { QuickLinks } from "@/components/home/QuickLinks"
import { LatestJobs } from "@/components/home/LatestJobs"
import { UpcomingDeadlines } from "@/components/home/UpcomingDeadlines"

const LatestResults = dynamic(() => import("@/components/home/LatestResults").then(m => ({ default: m.LatestResults })))
const LatestAdmitCards = dynamic(() => import("@/components/home/LatestAdmitCards").then(m => ({ default: m.LatestAdmitCards })))
const TrendingNotifications = dynamic(() => import("@/components/home/TrendingNotifications").then(m => ({ default: m.TrendingNotifications })))
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
<div className="container mx-auto px-4">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-16">
            <LatestResults />
<LatestAdmitCards />
          </div>
          <div className="space-y-8">
            <TrendingNotifications />
</div>
        </div>
      </div>
      <JobsByQualification />
<LatestBlog />
      <LatestPrivateJobs />
<PopularExams />
      <FAQ />
      <Newsletter />
    </>
  )
}
