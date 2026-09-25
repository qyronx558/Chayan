import dynamic from "next/dynamic"
import { FeaturedSlider } from "@/components/home/FeaturedSlider"
import { SearchBar } from "@/components/home/SearchBar"
import { QuickLinks } from "@/components/home/QuickLinks"
import { RecentlyViewed } from "@/components/home/RecentlyViewed"
import { LatestJobs } from "@/components/home/LatestJobs"
import { UpcomingDeadlines } from "@/components/home/UpcomingDeadlines"
import { TrustBadges } from "@/components/home/TrustBadges"

const LatestResults = dynamic(() => import("@/components/home/LatestResults").then(m => ({ default: m.LatestResults })))
const LatestAdmitCards = dynamic(() => import("@/components/home/LatestAdmitCards").then(m => ({ default: m.LatestAdmitCards })))
const JobsByQualification = dynamic(() => import("@/components/home/JobsByQualification").then(m => ({ default: m.JobsByQualification })))
const LatestPrivateJobs = dynamic(() => import("@/components/home/LatestPrivateJobs").then(m => ({ default: m.LatestPrivateJobs })))
const PopularExams = dynamic(() => import("@/components/home/PopularExams").then(m => ({ default: m.PopularExams })))
const LatestBlog = dynamic(() => import("@/components/home/LatestBlog").then(m => ({ default: m.LatestBlog })))

export default function HomePage() {
  return (
    <>
      <FeaturedSlider />
      <SearchBar />
      <QuickLinks />
      <RecentlyViewed />
      <UpcomingDeadlines />
      <LatestJobs />
      <LatestResults />
      <LatestAdmitCards />
      <JobsByQualification />
      <LatestBlog />
      <LatestPrivateJobs />
      <PopularExams />
      <TrustBadges />
    </>
  )
}
