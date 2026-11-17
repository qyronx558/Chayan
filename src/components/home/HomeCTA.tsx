import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Newsletter } from "@/components/layout/Newsletter"
import { handFont } from "@/components/home/fonts"
import { cn } from "@/lib/utils"

/*
 * Alerts, presented the way a person would explain them: "here's what we'll
 * send you". Colour: the envelope is the calm trust teal (alerts are a promise
 * of reliability); the letter is plain paper; saffron appears only on the
 * stamp. The example letter is clearly labelled as an example.
 */

const SAMPLE = [
  { tag: "New job", tone: "var(--hs-trust)", text: "SSC CGL notification published · apply online now open" },
  { tag: "Result", tone: "oklch(55% 0.12 150)", text: "IBPS PO Mains result declared · check your roll number" },
  { tag: "Admit card", tone: "var(--hs-saffron)", text: "RRB NTPC CBT-1 hall ticket released · download link inside" },
]

function SampleLetter() {
  return (
    <figure className="relative mx-auto w-full max-w-md lg:mx-0">
      <div
        className="hs-r relative border border-[var(--hs-border)] bg-[var(--hs-surface)] p-6 shadow-[0_24px_50px_-28px_rgb(40_30_20/.45)] sm:p-7 lg:rotate-[1.5deg]"
      >
        {/* stamp */}
        <div
          className="absolute right-5 top-5 flex h-16 w-14 rotate-[4deg] flex-col items-center justify-center border-2 border-dashed text-center leading-none"
          style={{ borderColor: "color-mix(in oklch, var(--hs-saffron) 60%, transparent)", color: "var(--hs-saffron)" }}
          aria-hidden
        >
          <span className="text-[10px] font-bold">FREE</span>
          <span className="mt-1 font-display text-lg font-bold">₹0</span>
        </div>

        <dl className="space-y-1 pr-16 text-[12.5px] text-muted-foreground">
          <div className="flex gap-2">
            <dt className="w-14 shrink-0">From</dt>
            <dd className="font-medium text-foreground">ChayanJobs alerts</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-14 shrink-0">To</dt>
            <dd className="font-medium text-foreground">you</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-14 shrink-0">Subject</dt>
            <dd className="font-medium text-foreground">3 updates you asked for</dd>
          </div>
        </dl>

        <hr className="my-5 border-dashed border-[var(--hs-border-strong)]" />

        <p className="text-[14px] text-foreground">Namaste,</p>
        <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">Here is what was published since we last wrote:</p>

        <ul className="mt-4 space-y-3">
          {SAMPLE.map((s) => (
            <li key={s.tag} className="flex gap-3">
              <span className="mt-[7px] h-2 w-2 shrink-0 rounded-full" style={{ background: s.tone }} aria-hidden />
              <span className="min-w-0 text-[13.5px] leading-snug">
                <span className="font-semibold" style={{ color: s.tone }}>
                  {s.tag}:
                </span>{" "}
                <span className="text-foreground">{s.text}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className={cn(handFont.className, "mt-6 text-[1.25rem] leading-snug text-foreground/80")}>
          All the best for your preparation!
        </p>
      </div>
      <figcaption className="mt-4 text-center text-xs text-muted-foreground lg:pr-6 lg:text-right">
        An example of the email you would receive
      </figcaption>
    </figure>
  )
}

export function HomeCTA({ className }: { className?: string }) {
  return (
    <section className={`hs-section scroll-mt-24${className ? ` ${className}` : ""}`} id="alerts">
      <div className="hs-container">
        <div className="grid min-w-0 items-center gap-10 lg:grid-cols-12 lg:gap-6">
          {/* envelope */}
          <div className="hs-r-lg hs-bg-trust relative min-w-0 overflow-hidden p-7 sm:p-10 lg:col-span-7 lg:py-14 lg:pr-24">
            {/* envelope flap, drawn with a single hairline */}
            <svg
              className="pointer-events-none absolute inset-x-0 top-0 h-24 w-full opacity-20"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path d="M0 0 L50 18 L100 0" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>

            <p className={cn(handFont.className, "relative text-[1.2rem] opacity-80")}>Stop checking ten websites every morning.</p>
            <h2 className="relative mt-2 break-words text-[2rem] font-bold leading-[1.1] sm:text-[2.6rem]">
              We&apos;ll write to you when it&apos;s out.
            </h2>
            <p className="relative mt-4 max-w-lg text-[15.5px] leading-[1.7] opacity-80">
              Leave your email once. When a verified job, result or admit card is published, one short email reaches you.
              No noise, no spam, and you can unsubscribe any time.
            </p>

            <div className="hs-r relative mt-7 max-w-md border border-current/20 bg-black/10 p-4">
              <Newsletter variant="footer" />
            </div>
          </div>

          {/* letter */}
          <div className="min-w-0 lg:col-span-5 lg:-ml-16">
            <SampleLetter />
          </div>
        </div>

        <div className="mt-10 grid gap-3 border-t border-[var(--hs-border)] pt-6 sm:grid-cols-2">
          <Link href="/register" className="group flex items-center justify-between gap-4 py-2">
            <span>
              <span className="block text-[15px] font-semibold text-foreground">Preparing for an exam?</span>
              <span className="block text-sm text-muted-foreground">Create a free account to save jobs and track your applications.</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--hs-trust)]" />
          </Link>
          <Link href="/employer" className="group flex items-center justify-between gap-4 py-2 sm:border-l sm:border-[var(--hs-border)] sm:pl-6">
            <span>
              <span className="block text-[15px] font-semibold text-foreground">Hiring?</span>
              <span className="block text-sm text-muted-foreground">Post a verified opening and reach serious candidates.</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--hs-trust)]" />
          </Link>
        </div>
      </div>
    </section>
  )
}
