"use client"

import { Briefcase } from "lucide-react"
import { HomeSectionHeader } from "@/components/home/ui/HomeSectionHeader"
import { LatestJobs } from "@/components/home/LatestJobs"
import { LatestPrivateJobs } from "@/components/home/LatestPrivateJobs"
import { formatDate } from "@/lib/utils"

/*
 * Government and private jobs, set as the vacancies page of a newspaper —
 * the page every aspirant's family used to fold open on Sunday. The reader
 * (us) has gone through it with a red pen and circled what's urgent.
 */
export function HomeJobsHub() {
  return (
    <section className="hs-section pt-4 sm:pt-6" aria-label="Latest jobs">
      <div className="hs-container">
        <HomeSectionHeader
          eyebrow="fresh this week"
          icon={Briefcase}
          title="Who is hiring right now"
          mark="right now"
          markStyle="circle"
          subtitle="Remember the vacancies page, folded open on the dining table, dates circled in pen? We still read it that way, for you."
        />

        <div
          className="relative rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] px-4 pb-6 pt-5 sm:px-8"
          style={{
            boxShadow: "0 1px 2px rgb(60 40 10 / .08), 0 26px 50px -36px rgb(60 40 10 / .55)",
          }}
        >
          {/* the centre fold of a newspaper opened flat */}
          <span
            className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-6 -translate-x-1/2 lg:block"
            style={{ background: "linear-gradient(90deg, transparent, color-mix(in oklch, var(--color-ink) 6%, transparent), transparent)" }}
            aria-hidden
          />
          {/* masthead */}
          <div className="text-center">
            <div className="flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
              <span>Vol. CJ · Weekly</span>
              <span className="hidden sm:inline">{formatDate(new Date(), "EEEE, d MMMM yyyy")}</span>
              <span>Price: free, always</span>
            </div>
            <p className="mt-2 font-display text-[2rem] font-bold leading-none tracking-tight text-foreground sm:text-[2.8rem]">
              The Vacancy Page
            </p>
            <div className="mt-3 border-y-[3px] border-double border-[var(--color-ink)]/70 py-1 text-[11px] text-muted-foreground">
              Government notifications · Situations vacant · Walk-ins · Internships
            </div>
          </div>


          <div className="mt-5 grid min-w-0 gap-8 lg:grid-cols-2 lg:gap-0">
            <LatestJobs className="lg:border-r lg:border-[var(--hs-border-strong)] lg:pr-7" />
            <LatestPrivateJobs className="lg:pl-7" />
          </div>
        </div>
      </div>
    </section>
  )
}
