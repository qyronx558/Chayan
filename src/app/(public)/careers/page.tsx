import type { Metadata } from "next"
import { Fraunces } from "next/font/google"
import { ArrowDown, Mail } from "lucide-react"
import { CareersApplySection } from "@/components/careers/CareersApplySection"
import { careersFormConfig } from "@/lib/careers"
import { cn } from "@/lib/utils"

const serif = Fraunces({ subsets: ["latin"], weight: ["500", "600"] })

export const metadata: Metadata = {
  title: "Careers",
  description: "Apply to ChayanJobs. Fill the form below.",
}

const facts = [
  { k: "Location", v: "Remote · India" },
  { k: "Response", v: "Within 5 working days" },
  { k: "Process", v: "One form, one call" },
]

const topics = [
  "UPSC CSE",
  "SSC CGL",
  "RRB NTPC",
  "IBPS PO",
  "Admit Cards",
  "Cut-offs",
  "Merit Lists",
  "Answer Keys",
  "Syllabus",
]

export default function CareersPage() {
  return (
    <div className="bg-[#faf9f7] dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        {/* Masthead rule */}
        <div className="flex items-baseline justify-between border-b-2 border-gray-900 pb-3 dark:border-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
            ChayanJobs - Careers
          </p>
          <p className="hidden text-[11px] font-medium uppercase tracking-[0.22em] text-gray-500 sm:block dark:text-gray-400">
            New Delhi / Remote
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Sticky editorial aside */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800 dark:text-teal-300">
                Open applications
              </p>
              <h1
                className={cn(
                  serif.className,
                  "mt-3 text-balance text-4xl font-medium leading-[1.08] tracking-tight text-gray-900 md:text-5xl dark:text-white"
                )}
              >
                Work on what lakhs of aspirants read daily.
              </h1>
              <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-gray-600 dark:text-gray-400">
                Tell us what you do best. One form, no portals, no reference codes.
              </p>

              <div className="mt-5 flex max-w-xs flex-wrap gap-1.5" aria-label="What the team works on">
                {topics.map((t) => (
                  <span
                    key={t}
                    className="cursor-default border border-gray-300 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-600 transition-colors hover:border-gray-900 hover:bg-gray-900 hover:text-white dark:border-gray-700 dark:text-gray-400 dark:hover:border-white dark:hover:bg-white dark:hover:text-gray-900"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <dl className="mt-8 border-t border-gray-300 dark:border-gray-800">
                {facts.map((f, i) => (
                  <div
                    key={f.k}
                    className="flex items-baseline justify-between gap-4 border-b border-gray-300 py-3 dark:border-gray-800"
                  >
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                      {String(i + 1).padStart(2, "0")} - {f.k}
                    </dt>
                    <dd className="text-right text-sm font-medium text-gray-900 dark:text-white">
                      {f.v}
                    </dd>
                  </div>
                ))}
              </dl>

              <a
                href={`mailto:${careersFormConfig.contactEmail}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-gray-900 underline decoration-teal-700 decoration-2 underline-offset-4 hover:text-teal-800 dark:text-white dark:hover:text-teal-300"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {careersFormConfig.contactEmail}
              </a>
              <p className="mt-8 hidden items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-400 lg:inline-flex dark:text-gray-500">
                The form <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /> - on the right
              </p>
            </div>
          </aside>

          {/* Form sheet */}
          <div className="lg:col-span-8">
            <div className="border border-gray-300 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-300 px-5 py-3 dark:border-gray-800 md:px-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-900 dark:text-white">
                  Application
                </p>
                <p className="font-mono text-xs text-gray-400 dark:text-gray-500">01 / 01</p>
              </div>
              <div className="px-2 py-2 md:px-3 md:py-3">
                <CareersApplySection />
              </div>
              <p className="border-t border-gray-200 px-5 py-3 text-xs text-gray-400 md:px-7 dark:border-gray-800 dark:text-gray-500">
                Responses go straight to our hiring sheet. Nothing else is asked of you here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
