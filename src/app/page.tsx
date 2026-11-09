import dynamic from "next/dynamic"
import { HomeHero } from "@/components/home/HomeHero"
import { QuickLinks } from "@/components/home/QuickLinks"
import { RecentlyViewed } from "@/components/home/RecentlyViewed"
import { LatestJobs } from "@/components/home/LatestJobs"
import { UpcomingDeadlines } from "@/components/home/UpcomingDeadlines"
import { TrustBadges } from "@/components/home/TrustBadges"
import { HomeCTA } from "@/components/home/HomeCTA"

const TrendingNow = dynamic(() => import("@/components/home/TrendingNow").then(m => ({ default: m.TrendingNow })))
const LatestUpdatesBoard = dynamic(() => import("@/components/home/LatestUpdatesBoard").then(m => ({ default: m.LatestUpdatesBoard })))
const JobsByQualification = dynamic(() => import("@/components/home/JobsByQualification").then(m => ({ default: m.JobsByQualification })))
const LatestPrivateJobs = dynamic(() => import("@/components/home/LatestPrivateJobs").then(m => ({ default: m.LatestPrivateJobs })))
const PopularExams = dynamic(() => import("@/components/home/PopularExams").then(m => ({ default: m.PopularExams })))
const LatestBlog = dynamic(() => import("@/components/home/LatestBlog").then(m => ({ default: m.LatestBlog })))

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <QuickLinks />
      <RecentlyViewed />
      <TrendingNow />
      <UpcomingDeadlines />
      <LatestJobs />
      <LatestUpdatesBoard />
      <JobsByQualification />
      <LatestPrivateJobs />
      <PopularExams />
      <LatestBlog />
      <TrustBadges />
      <HomeCTA />
    </>
  )
}
