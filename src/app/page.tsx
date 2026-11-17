import dynamic from "next/dynamic"
import "./home.css"
import { HomeHero } from "@/components/home/HomeHero"
import { QuickLinks } from "@/components/home/QuickLinks"
import { RecentlyViewed } from "@/components/home/RecentlyViewed"
import { HomeJobsHub } from "@/components/home/HomeJobsHub"
import { UpcomingDeadlines } from "@/components/home/UpcomingDeadlines"
import { HowItWorks } from "@/components/home/HowItWorks"
import { TrustBadges } from "@/components/home/TrustBadges"
import { HomeCTA } from "@/components/home/HomeCTA"
import { AspirantNote } from "@/components/home/AspirantNote"

const TrendingNow = dynamic(() => import("@/components/home/TrendingNow").then(m => ({ default: m.TrendingNow })))
const LatestUpdatesBoard = dynamic(() => import("@/components/home/LatestUpdatesBoard").then(m => ({ default: m.LatestUpdatesBoard })))
const JobsByQualification = dynamic(() => import("@/components/home/JobsByQualification").then(m => ({ default: m.JobsByQualification })))
const PopularExams = dynamic(() => import("@/components/home/PopularExams").then(m => ({ default: m.PopularExams })))
const LatestBlog = dynamic(() => import("@/components/home/LatestBlog").then(m => ({ default: m.LatestBlog })))

/**
 * Home page body. Header and footer come from the root layout and are untouched;
 * everything here is scoped under `.home-saas` (see ./home.css).
 */
export default function HomePage() {
  return (
    <div className="home-saas text-foreground">
      {/* 1. Hero: pitch, pill search, live featured card, KPI strip */}
      <HomeHero />

      {/* 2. Bento map of every section */}
      <QuickLinks />

      {/* 3. Returning visitors only */}
      <RecentlyViewed />

      {/* 4. Government + private jobs side by side */}
      <HomeJobsHub />

      {/* 5. Main column + sidebar */}
      <section className="hs-section pt-0 sm:pt-0" aria-label="Updates and deadlines">
        <div className="hs-container grid min-w-0 gap-8 lg:grid-cols-12">
          <div className="min-w-0 space-y-14 lg:col-span-8">
            <LatestUpdatesBoard />
            <TrendingNow />
          </div>
          <aside className="flex min-w-0 flex-col gap-5 lg:col-span-4" aria-label="Deadlines and popular exams">
            <UpcomingDeadlines />
            <PopularExams className="lg:sticky lg:top-24" />
          </aside>
        </div>
      </section>

      {/* 6. Eligibility filter */}
      <JobsByQualification />

      {/* 7. Journey + trust */}
      <section className="hs-section" aria-label="How it works">
        <div className="hs-container grid min-w-0 gap-5 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <HowItWorks />
          </div>
          <div className="min-w-0 lg:col-span-5">
            <TrustBadges />
          </div>
        </div>
      </section>

      {/* 8. A human note */}
      <AspirantNote />

      {/* 9. Editorial */}
      <LatestBlog />

      {/* 10. Alerts + account CTA */}
      <HomeCTA />
    </div>
  )
}
