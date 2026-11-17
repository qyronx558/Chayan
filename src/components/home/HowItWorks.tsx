import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"
import { HandEyebrow, HandHeading, MarkedTitle } from "@/components/home/ui/HandTitle"

/*
 * The aspirant's road, drawn like a route someone sketched in pencil on the
 * back of a notebook: a wobbly dashed path, circled stops, and a margin note
 * at each stop about what that stage actually feels like.
 */

const STEPS = [
  { label: "Search", sub: "Find openings that match your qualification", feel: "the hunt begins" },
  { label: "Apply", sub: "Verified steps and the official link", feel: "photo size, signature, fee…" },
  { label: "Admit card", sub: "We tell you the day hall tickets drop", feel: "the long wait" },
  { label: "Exam", sub: "Syllabus, pattern and key dates", feel: "deep breath" },
  { label: "Result", sub: "Results, answer keys and cut-offs", feel: "your name on the list" },
]

const PENCIL = "color-mix(in oklch, var(--color-ink) 45%, transparent)"

export function HowItWorks() {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-[6px] border border-[var(--hs-border)] bg-[var(--hs-surface)] p-6 sm:p-8 lg:-rotate-[0.3deg]"
      style={{
        boxShadow: "0 1px 2px rgb(60 40 10 / .06), 0 22px 44px -32px rgb(60 40 10 / .4)",
        backgroundImage:
          "radial-gradient(circle, color-mix(in oklch, var(--color-ink) 9%, transparent) 1px, transparent 1.2px)",
        backgroundSize: "18px 18px",
      }}
    >
      <HandHeading>
        <HandEyebrow>how it works</HandEyebrow>
        <h2 className="mt-2 text-2xl font-bold leading-[1.25] text-foreground sm:text-[1.9rem]">
          <MarkedTitle title="The long road from notification to result" mark="long road" />
        </h2>
      </HandHeading>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
        It usually takes months, sometimes years. We can&apos;t walk it for you, but we can make sure you never miss a turn.
      </p>

      <div className="relative mb-9 mt-9">
        {/* the pencil route (desktop: across, wobbling) */}
        <svg
          className="pointer-events-none absolute inset-x-[8%] top-[6px] hidden h-10 w-[84%] sm:block"
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M2 18 C 40 4, 70 32, 100 18 S 160 6, 200 20 S 260 34, 300 18 S 360 6, 398 20"
            fill="none"
            stroke={PENCIL}
            strokeWidth="1.6"
            strokeDasharray="5 6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* mobile: straight down the margin */}
        <span
          className="absolute bottom-6 left-[19px] top-4 w-0 border-l-[1.6px] border-dashed sm:hidden"
          style={{ borderColor: PENCIL }}
          aria-hidden
        />

        <ol className="relative grid gap-6 sm:grid-cols-5 sm:gap-2">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex items-start gap-4 sm:flex-col sm:items-center sm:text-center">
              <span
                className={cn(
                  handFont.className,
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--hs-surface)] text-xl text-foreground"
                )}
              >
                {/* a circle drawn by hand — never quite closed */}
                <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full" aria-hidden>
                  <path
                    d={
                      i % 2
                        ? "M20 3 C 31 2, 38 10, 37 21 C 36 32, 27 38, 18 37 C 8 36, 2 28, 3 18 C 4 9, 11 4, 23 4"
                        : "M22 3 C 11 2, 3 9, 3 20 C 3 31, 11 38, 21 37 C 31 36, 38 29, 37 19 C 36 9, 29 3, 17 5"
                    }
                    fill="none"
                    stroke={i === 0 ? "var(--color-brick)" : "var(--hs-trust)"}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold text-foreground">{s.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{s.sub}</span>
                <span className={cn(handFont.className, "mt-1.5 block text-[1rem] leading-tight text-[var(--color-brick)]/80")}>
                  {s.feel}
                </span>
              </span>
            </li>
          ))}
        </ol>

        {/* "you are here" */}
        <span
          className={cn(
            handFont.className,
            "absolute -top-8 left-[2%] hidden -rotate-[6deg] text-[1rem] text-[var(--color-brick)] sm:block"
          )}
          aria-hidden
        >
          you are here ↓
        </span>
      </div>

      {/* a tip on a sticky note — the thing seniors tell you after your first form */}
      <Link
        href="/tools"
        className="group relative mx-auto mb-9 block max-w-md -rotate-[1.2deg] px-5 pb-4 pt-6 transition-transform hover:rotate-0"
        style={{
          background: "color-mix(in oklch, var(--hs-marigold) 30%, var(--hs-surface))",
          boxShadow: "0 1px 1px rgb(60 40 10 / .08), 0 12px 20px -14px rgb(60 40 10 / .45)",
        }}
      >
        <span
          className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[2deg]"
          style={{ background: "color-mix(in oklch, var(--hs-surface) 70%, transparent)", boxShadow: "0 1px 2px rgb(0 0 0 / .08)" }}
          aria-hidden
        />
        <span className={cn(handFont.className, "block text-[1.15rem] leading-snug text-foreground/85")}>
          Tip from someone who&apos;s filled a hundred forms: keep your photo, signature and certificates scanned in the
          right size, in one folder. It saves an hour on every application.
        </span>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--hs-trust)]">
          Resize them free with our tools
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      <div className="mt-auto grid gap-x-6 gap-y-2 border-t border-dashed border-[var(--hs-border-strong)] pt-5 sm:grid-cols-2">
        <Link href="/tools" className="group flex items-center justify-between gap-3 py-1.5">
          <span className="min-w-0">
            <span className="block text-sm font-bold text-foreground">Free aspirant tools</span>
            <span className="block truncate text-xs text-muted-foreground">Age calculator, photo resizer &amp; more</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--hs-trust)]" />
        </Link>
        <Link href="/register" className="group flex items-center justify-between gap-3 py-1.5 sm:border-l sm:border-dashed sm:border-[var(--hs-border-strong)] sm:pl-6">
          <span className="min-w-0">
            <span className="block text-sm font-bold text-foreground">Track every application</span>
            <span className="block truncate text-xs text-muted-foreground">Free account, saved jobs &amp; alerts</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--hs-trust)]" />
        </Link>
      </div>
    </div>
  )
}
