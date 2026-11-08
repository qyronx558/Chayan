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
    <div className="bg-background dark:bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        {/* Masthead rule */}
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground dark:text-muted-foreground">
            ChayanJobs - Careers
          </p>
          <p className="hidden text-[11px] font-medium tracking-[0.22em] text-muted-foreground sm:block dark:text-muted-foreground">
            New Delhi / Remote
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Sticky editorial aside */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-semibold tracking-[0.2em] text-brick dark:text-brick">
                Open applications
              </p>
              <h1
                className={cn(
                  serif.className,
                  "mt-3 text-balance text-4xl font-medium leading-[1.08] tracking-tight text-foreground md:text-5xl dark:text-paper"
                )}
              >
                Work on what lakhs of aspirants read daily.
              </h1>
              <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-muted-foreground dark:text-muted-foreground">
                Tell us what you do best. One form, no portals, no reference codes.
              </p>

              <div className="mt-5 flex max-w-xs flex-wrap gap-1.5" aria-label="What the team works on">
                {topics.map((t) => (
                  <span
                    key={t}
                    className="cursor-default border border-rule px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-muted-foreground transition-colors hover:border-ink hover:bg-ink hover:text-paper dark:border-ink dark:text-muted-foreground dark:hover:border-white dark:hover:bg-background dark:hover:text-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <dl className="mt-8 border-t border-rule dark:border-ink">
                {facts.map((f, i) => (
                  <div
                    key={f.k}
                    className="flex items-baseline justify-between gap-4 border-b border-rule py-3 dark:border-ink"
                  >
                    <dt className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground dark:text-muted-foreground">
                      {String(i + 1).padStart(2, "0")} - {f.k}
                    </dt>
                    <dd className="text-right text-sm font-medium text-foreground dark:text-paper">
                      {f.v}
                    </dd>
                  </div>
                ))}
              </dl>

              <a
                href={`mailto:${careersFormConfig.contactEmail}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground underline decoration-teal-700 decoration-2 underline-offset-4 hover:text-brick dark:text-paper dark:hover:text-brick"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {careersFormConfig.contactEmail}
              </a>
              <p className="mt-8 hidden items-center gap-2 text-xs tracking-[0.18em] text-muted-foreground lg:inline-flex dark:text-muted-foreground">
                The form <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /> - on the right
              </p>
            </div>
          </aside>

          {/* Form sheet */}
          <div className="lg:col-span-8">
            <div className="border border-rule bg-background dark:border-ink dark:bg-ink">
              <div className="flex items-center justify-between border-b border-rule px-5 py-3 dark:border-ink md:px-7">
                <p className="text-xs font-semibold tracking-[0.2em] text-foreground dark:text-paper">
                  Application
                </p>
                <p className="font-mono text-xs text-muted-foreground dark:text-muted-foreground">01 / 01</p>
              </div>
              <div className="px-2 py-2 md:px-3 md:py-3">
                <CareersApplySection />
              </div>
              <p className="border-t border-rule px-5 py-3 text-xs text-muted-foreground md:px-7 dark:border-ink dark:text-muted-foreground">
                Responses go straight to our hiring sheet. Nothing else is asked of you here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
