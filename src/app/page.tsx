import dynamic from "next/dynamic"
import { FeaturedSlider } from "@/components/home/FeaturedSlider"
import { SearchBar } from "@/components/home/SearchBar"
import { QuickLinks } from "@/components/home/QuickLinks"
import { RecentlyViewed } from "@/components/home/RecentlyViewed"
import { LatestJobs } from "@/components/home/LatestJobs"
import { UpcomingDeadlines } from "@/components/home/UpcomingDeadlines"
import { TrustBadges } from "@/components/home/TrustBadges"

const TrendingNow = dynamic(() => import("@/components/home/TrendingNow").then(m => ({ default: m.TrendingNow })))
const LatestResults = dynamic(() => import("@/components/home/LatestResults").then(m => ({ default: m.LatestResults })))
const LatestAdmitCards = dynamic(() => import("@/components/home/LatestAdmitCards").then(m => ({ default: m.LatestAdmitCards })))
const LatestAnswerKeys = dynamic(() => import("@/components/home/LatestAnswerKeys").then(m => ({ default: m.LatestAnswerKeys })))
const LatestSyllabus = dynamic(() => import("@/components/home/LatestSyllabus").then(m => ({ default: m.LatestSyllabus })))
const LatestAdmissions = dynamic(() => import("@/components/home/LatestAdmissions").then(m => ({ default: m.LatestAdmissions })))
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
      <TrendingNow />
      <UpcomingDeadlines />
      <LatestJobs />
      <LatestResults />
      <LatestAdmitCards />
      <LatestAnswerKeys />
      <LatestSyllabus />
      <LatestAdmissions />
      <JobsByQualification />
      <LatestBlog />
      <LatestPrivateJobs />
      <PopularExams />
      <TrustBadges />
    </>
  )
}
