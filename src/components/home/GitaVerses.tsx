"use client"

import { useState, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { HandEyebrow, MarkedTitle } from "@/components/home/ui/HandTitle"

interface Verse {
  key: string
  theme: string
  ref: string
  refDevanagari: string
  sanskrit: [string, string]
  iast: [string, string]
  meaning: string
  forYou: string
}

/*
 * Sanskrit text and IAST transliteration follow the standard critical text.
 * "meaning" is a plain-English rendering; "forYou" is our own reflection and is
 * labelled as such on the page, never presented as scripture.
 */
const VERSES: Verse[] = [
  {
    key: "effort",
    theme: "On effort",
    ref: "2.47",
    refDevanagari: "२.४७",
    sanskrit: ["कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।", "मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥"],
    iast: ["karmaṇy evādhikāras te mā phaleṣu kadācana", "mā karma-phala-hetur bhūr mā te saṅgo ’stv akarmaṇi"],
    meaning:
      "Your right is to the work alone, never to its fruits. Do not let the fruit be your motive, and do not let that make you give up the work.",
    forYou:
      "The cut-off, the merit list, the day the result comes out: none of that is in your hands this morning. The next chapter, the next mock test, the next hour of revision is. Give that hour everything, and let the result be what it will be.",
  },
  {
    key: "results",
    theme: "On results",
    ref: "2.48",
    refDevanagari: "२.४८",
    sanskrit: ["योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय ।", "सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते ॥"],
    iast: ["yoga-sthaḥ kuru karmāṇi saṅgaṁ tyaktvā dhanañjaya", "siddhy-asiddhyoḥ samo bhūtvā samatvaṁ yoga ucyate"],
    meaning:
      "Steady within, do your work, Arjuna, letting go of attachment. Stay the same in success and in failure. That evenness of mind is called yoga.",
    forYou:
      "A long preparation brings both a selection list with your name and one without it. Krishna does not ask you to stop caring. He asks you to stay steady, because a steady mind revises better, sleeps better and writes a better paper.",
  },
  {
    key: "self",
    theme: "On self-belief",
    ref: "6.5",
    refDevanagari: "६.५",
    sanskrit: ["उद्धरेदात्मनात्मानं नात्मानमवसादयेत् ।", "आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः ॥"],
    iast: ["uddhared ātmanātmānaṁ nātmānam avasādayet", "ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ"],
    meaning:
      "Lift yourself by your own effort; do not let yourself sink. You alone are your own friend, and you alone can be your own enemy.",
    forYou:
      "Nobody else can attend your classes or sit your exam for you. On the days the motivation is gone, be to yourself the friend you would be to anyone else: kind about yesterday, firm about tomorrow, and back at the desk.",
  },
]

/* A clay diya; the flame flickers, the glow breathes. */
function Diya() {
  return (
    <svg viewBox="0 0 120 90" className="h-[96px] w-[128px] sm:h-[110px] sm:w-[146px]" aria-hidden>
      <defs>
        <radialGradient id="diya-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="oklch(88% 0.15 85)" stopOpacity=".9" />
          <stop offset="100%" stopColor="oklch(88% 0.15 85)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="diya-clay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(62% 0.11 45)" />
          <stop offset="100%" stopColor="oklch(44% 0.09 40)" />
        </linearGradient>
        <linearGradient id="diya-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="oklch(70% 0.19 45)" />
          <stop offset="55%" stopColor="oklch(85% 0.17 80)" />
          <stop offset="100%" stopColor="oklch(97% 0.06 95)" />
        </linearGradient>
      </defs>
      <circle className="hs-flame-glow" cx="66" cy="30" r="30" fill="url(#diya-glow)" style={{ transformOrigin: "66px 30px" }} />
      <path className="hs-flame" d="M66 8 C 72 20, 74 28, 66 40 C 58 28, 60 20, 66 8 Z" fill="url(#diya-flame)" />
      <path d="M66 40 L 66 46" stroke="oklch(30% 0.03 50)" strokeWidth="2" strokeLinecap="round" />
      {/* the lamp: a shallow bowl with a pinched spout */}
      <path d="M14 50 C 22 74, 78 80, 100 58 C 104 54, 108 50, 116 46 C 104 46, 96 48, 90 50 Z" fill="url(#diya-clay)" />
      <path d="M14 50 C 40 56, 70 55, 90 50" fill="none" stroke="oklch(72% 0.1 55)" strokeWidth="1.5" />
      <path d="M34 64 q 6 4 12 0 M52 67 q 6 4 12 0 M70 65 q 6 4 12 0" fill="none" stroke="oklch(75% 0.12 80)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function GitaVerses({ sanskritFont, handFont }: { sanskritFont: string; handFont: string }) {
  const [active, setActive] = useState(0)
  const v = VERSES[active]

  return (
    <div className="relative grid min-w-0 gap-10 lg:grid-cols-12 lg:gap-14">
      {/* ── left: the human note + verse picker ── */}
      <div className="min-w-0 lg:col-span-5 lg:pt-4">
        <HandEyebrow>for the long days</HandEyebrow>
        <h2 className="mt-2 text-[2rem] font-bold leading-[1.2] text-foreground sm:text-[2.5rem]">
          <MarkedTitle title="What the Gita says to someone preparing for an exam" mark="Gita" markStyle="highlight" />
        </h2>
        <p className="mt-4 text-[15.5px] leading-[1.75] text-muted-foreground">
          Most preparation happens where nobody sees it: before sunrise, between mock tests, in the long wait for a
          notification that may come next week or next year. Arjuna stood frozen before the hardest test of his life,
          unsure whether to even begin. What Krishna told him on that field still holds for anyone sitting at a desk
          today.
        </p>

        <p className={cn(handFont, "hs-ink mt-7 text-[1.1rem] text-[var(--hs-saffron)]")} style={{ animationDelay: ".4s" }} aria-hidden>
          pick the one you need today ↓
        </p>
        <div role="tablist" aria-label="Choose a verse" className="mt-2 grid gap-2">
          {VERSES.map((verse, i) => {
            const on = i === active
            return (
              <button
                key={verse.key}
                role="tab"
                aria-selected={on}
                onClick={() => setActive(i)}
                className={cn(
                  "hs-r-sm group flex items-center gap-4 border px-4 py-3 text-left transition-colors",
                  on
                    ? "border-[color-mix(in_oklch,var(--hs-marigold)_70%,var(--color-ink)_10%)] bg-[var(--hs-surface)]"
                    : "border-transparent hover:border-[var(--hs-border-strong)] hover:bg-[var(--hs-surface)]/60"
                )}
              >
                <span
                  className={cn(
                    sanskritFont,
                    "w-12 shrink-0 text-xl leading-none",
                    on ? "text-[var(--hs-saffron)]" : "text-muted-foreground"
                  )}
                >
                  {verse.refDevanagari}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[15px] font-semibold", on ? "text-foreground" : "text-muted-foreground")}>
                    {verse.theme}
                  </span>
                  <span className="block text-xs text-muted-foreground">Bhagavad Gita {verse.ref}</span>
                </span>
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full transition-colors",
                    on ? "bg-[var(--hs-saffron)]" : "bg-transparent"
                  )}
                  aria-hidden
                />
              </button>
            )
          })}
        </div>

        <p className={cn(handFont, "hs-ink mt-8 text-[1.35rem] leading-snug text-foreground/80")} style={{ animationDelay: "1s", animationDuration: "2.2s" }}>
          Keep going, one chapter at a time.
          <span className="mt-1 block text-base text-muted-foreground">— from all of us at the ChayanJobs desk</span>
        </p>
      </div>

      {/* ── right: the verse, set like a manuscript leaf ── */}
      <figure
        key={v.key}
        className="hs-turn relative min-w-0 self-start lg:col-span-7"
        aria-live="polite"
      >
        <div
          className="hs-r-lg relative bg-[var(--hs-surface)] px-6 py-9 sm:px-12 sm:py-12"
          style={{
            boxShadow:
              "inset 0 0 0 1px color-mix(in oklch, var(--hs-marigold) 55%, transparent), inset 0 0 0 7px var(--hs-surface), inset 0 0 0 8px color-mix(in oklch, var(--hs-marigold) 35%, transparent), 0 20px 50px -30px rgb(60 40 10 / .35)",
          }}
        >
          {/* silk bookmark ribbon, swaying a little */}
          <span className="hs-sway pointer-events-none absolute -top-1 right-10 block sm:right-14" aria-hidden>
            <svg width="22" height="86" viewBox="0 0 22 86">
              <path d="M0 0 H22 V86 L11 74 L0 86 Z" fill="var(--color-brick)" opacity=".85" />
              <path d="M3 0 V80" stroke="rgb(255 255 255 / .18)" strokeWidth="1" />
            </svg>
          </span>

          <p className="text-center text-[12px] font-semibold text-[var(--hs-saffron)]">
            <span className={sanskritFont}>श्रीमद्भगवद्गीता {v.refDevanagari}</span>
            <span className="mx-2 opacity-50">·</span>
            Bhagavad Gita {v.ref}
          </p>

          <blockquote lang="sa" className={cn(sanskritFont, "mt-6 text-center text-[1.45rem] leading-[1.9] text-foreground sm:text-[1.9rem]")}>
            <span className="hs-ink block" style={{ animationDelay: ".25s" }}>{v.sanskrit[0]}</span>
            <span className="hs-ink block" style={{ animationDelay: "1.3s" }}>{v.sanskrit[1]}</span>
          </blockquote>

          <p lang="sa-Latn" className={cn(sanskritFont, "hs-fade-up mt-4 text-center text-[15px] italic leading-relaxed text-muted-foreground")} style={{ animationDelay: "2.3s" }}>
            {v.iast[0]}
            <br />
            {v.iast[1]}
          </p>

          <div className="hs-fade-up my-7 flex items-center justify-center gap-3 text-[var(--hs-saffron)]" style={{ animationDelay: "2.6s" }} aria-hidden>
            <span className="h-px w-16 bg-current opacity-30" />
            <span className={cn(sanskritFont, "text-lg")}>॥</span>
            <span className="h-px w-16 bg-current opacity-30" />
          </div>

          <p className="hs-fade-up mx-auto max-w-xl text-center font-display text-[1.2rem] leading-[1.55] text-foreground sm:text-[1.35rem]" style={{ animationDelay: "2.8s" }}>
            “{v.meaning}”
          </p>
          {/* someone underlined it in saffron pencil */}
          <svg viewBox="0 0 240 12" className="mx-auto mt-2 h-3 w-48" preserveAspectRatio="none" aria-hidden>
            <path
              className="hs-draw"
              d="M3 7 C 40 3, 80 10, 120 6 S 200 3, 237 7"
              fill="none"
              stroke="var(--hs-saffron)"
              strokeWidth="2.2"
              strokeLinecap="round"
              style={{ ["--len" as string]: 260, animationDelay: "3.5s" } as CSSProperties}
            />
          </svg>

          <div className="hs-fade-up hs-r mx-auto mt-6 max-w-xl border-l-[3px] border-[var(--hs-trust)] bg-[var(--hs-trust-soft)] px-5 py-4" style={{ animationDelay: "3.8s" }}>
            <p className="text-[12px] font-semibold text-[var(--hs-trust)]">What it can mean for you</p>
            <p className="mt-1.5 text-[14.5px] leading-[1.7] text-foreground/85">{v.forYou}</p>
          </div>
        </div>
        {/* a diya kept beside the book */}
        <div className="pointer-events-none absolute -bottom-12 -left-3 sm:-left-16" aria-hidden>
          <Diya />
        </div>
      </figure>
    </div>
  )
}
