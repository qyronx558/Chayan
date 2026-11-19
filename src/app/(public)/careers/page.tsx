import type { Metadata } from "next"
import { Mail } from "lucide-react"
import { CareersApplySection } from "@/components/careers/CareersApplySection"
import { careersFormConfig } from "@/lib/careers"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import "@/app/home.css"


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

/* The careers page is a "Situations Vacant" ad cut out of the paper, with
 * the application form waiting on a clipboard beside it. */
const AD_PAPER = "oklch(96% 0.025 85)"
const AD_INK = "oklch(26% 0.03 60)"

export default function CareersPage() {
  return (
    <div className="home-saas text-foreground">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:px-8 md:pt-14">
        <p className={cn(handFont.className, "text-center text-[1.25rem] text-[var(--color-brick)]")}>careers at ChayanJobs</p>
        <h1 className="mx-auto mt-1 max-w-3xl text-balance text-center font-display text-[2.4rem] font-black leading-[1.05] text-foreground md:text-[3.4rem]">
          Work on what lakhs of aspirants read daily.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-center text-[15.5px] leading-relaxed text-muted-foreground">
          Tell us what you do best. One form, no portals, no reference codes.
        </p>

        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-14">
          {/* The classified ad, cut out and taped down */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <div className="relative -rotate-[1.2deg] px-6 pb-6 pt-5" style={{ background: AD_PAPER, color: AD_INK, boxShadow: "0 1px 2px rgb(60 40 10 / .1), 0 20px 34px -24px rgb(60 40 10 / .6)", clipPath: "polygon(0.5% 0.8%, 46% 0, 99.4% 0.6%, 100% 52%, 99.2% 99.4%, 51% 100%, 0 99.2%, 0.7% 48%)" }}>
                <span className="absolute -top-1 left-8 h-6 w-20 rotate-[-4deg] bg-[oklch(92%_0.05_95/0.7)]" aria-hidden />
                <p className={cn(typeFont.className, "border-b-2 border-current pb-1 text-center text-[11px] font-bold tracking-[0.3em]")}>SITUATIONS VACANT</p>
                <p className="mt-3 font-display text-[1.8rem] font-black leading-none">WANTED</p>
                <p className={cn(typeFont.className, "mt-2 text-[13px] leading-[1.65]")}>
                  People who remember their own form-filling days. Writers, checkers, designers and engineers to help
                  every aspirant find the right notice, on time, without the confusion. Must care about getting the
                  last date right.
                </p>

                <p className={cn(typeFont.className, "mt-4 text-[10.5px] font-bold tracking-[0.2em] opacity-70")}>THE WORK COVERS</p>
                <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-1" aria-label="What the team works on">
                  {topics.map((t, i) => (
                    <span key={t} className={cn(handFont.className, "text-[1.05rem] leading-snug", i % 3 === 0 && "underline decoration-[oklch(55%_0.18_28)] decoration-wavy decoration-1 underline-offset-4")}>
                      {t}
                      {i < topics.length - 1 && <span className="opacity-40">,</span>}
                    </span>
                  ))}
                </div>

                <dl className={cn(typeFont.className, "mt-5 border-t border-dashed border-current/40 pt-3 text-[12px]")}>
                  {facts.map((f) => (
                    <div key={f.k} className="flex items-baseline justify-between gap-4 py-1">
                      <dt className="font-bold opacity-70">{f.k.toUpperCase()}</dt>
                      <dd className="text-right">{f.v}</dd>
                    </div>
                  ))}
                </dl>

                <p className={cn(typeFont.className, "mt-4 text-[12px]")}>
                  Apply with the form, or write to{" "}
                  <a href={`mailto:${careersFormConfig.contactEmail}`} className="inline-flex items-center gap-1 font-bold underline underline-offset-2 hover:text-[oklch(50%_0.18_28)]">
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    {careersFormConfig.contactEmail}
                  </a>
                </p>
                <p className={cn(typeFont.className, "mt-4 text-right text-[10.5px] opacity-60")}>BOX NO. 01 / NEW DELHI · REMOTE</p>
              </div>
              <p className={cn(handFont.className, "mt-5 hidden rotate-[-2deg] text-center text-[1.15rem] text-muted-foreground lg:block")}>
                cut this out, then fill the form on the right →
              </p>
            </div>
          </aside>

          {/* The form, on a clipboard */}
          <div className="lg:col-span-7">
            <div className="relative rounded-[8px] p-3 pt-10 sm:p-4 sm:pt-11" style={{ background: "oklch(58% 0.07 60)", boxShadow: "inset 0 0 0 1px rgb(0 0 0 / .12), 0 24px 40px -26px rgb(40 20 0 / .7)" }}>
              <span className="absolute -top-3 left-1/2 h-10 w-32 -translate-x-1/2 rounded-[6px]" style={{ background: "linear-gradient(180deg, oklch(82% 0.01 250), oklch(62% 0.015 250))", boxShadow: "inset 0 1px 0 rgb(255 255 255 / .6), 0 3px 5px rgb(0 0 0 / .3)" }} aria-hidden>
                <span className="absolute left-1/2 top-2.5 h-3 w-12 -translate-x-1/2 rounded-full bg-[oklch(42%_0.01_250)]" />
              </span>
              <div className="rounded-[2px] bg-[var(--hs-paper-slip)]" style={{ boxShadow: "0 1px 2px rgb(0 0 0 / .15)" }}>
                <div className="flex items-center justify-between border-b border-dashed border-[var(--hs-border-strong)] px-5 py-3 md:px-7">
                  <p className={cn(typeFont.className, "text-[11px] font-bold tracking-[0.2em] text-foreground")}>APPLICATION</p>
                  <p className={cn(handFont.className, "text-[1.05rem] text-[var(--color-brick)]")}>takes about 5 minutes</p>
                </div>
                <div className="px-2 py-2 md:px-3 md:py-3">
                  <CareersApplySection />
                </div>
                <p className={cn(handFont.className, "border-t border-dashed border-[var(--hs-border-strong)] px-5 py-3 text-[1.02rem] text-muted-foreground md:px-7")}>
                  responses go straight to our hiring sheet. a real person reads every one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
