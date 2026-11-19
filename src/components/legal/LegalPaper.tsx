import type { CSSProperties, ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { ClauseIndex } from "@/components/legal/ClauseIndex"
import "@/app/home.css"
import "@/components/legal/legal.css"

/*
 * Policies are promises written down. Each page is drawn as the everyday
 * object that holds that kind of promise, with one idea from science or
 * philosophy that explains why the promise exists, and a sticky note that
 * says it in plain words. The policy text itself is unchanged, and the
 * note says so: the full text is what counts.
 */

export type LegalKey = "privacy" | "terms" | "disclaimer" | "cookies" | "editorial" | "copyright" | "dmca"

const PAPER = "oklch(98% 0.008 90)"
const PAPER_INK = "oklch(27% 0.03 60)"
const STICKY = "oklch(93% 0.09 95)"
const paperShadow = "0 1px 2px rgb(60 40 10 / .08), 0 16px 28px -22px rgb(60 40 10 / .55)"

type Skin = {
  kicker: string
  object: string
  margin: string
  thought: { kind: "PHILOSOPHY" | "SCIENCE" | "LAW" | "HISTORY"; text: string; by: string; link: string }
  plain: string[]
}

const SKINS: Record<LegalKey, Skin> = {
  privacy: {
    kicker: "A DIARY WITH A LOCK",
    object: "your diary",
    margin: "what you tell us stays like a diary on a shelf: kept, not passed around.",
    thought: {
      kind: "PHILOSOPHY",
      text: "Act so that you treat humanity, in yourself and in others, never merely as a means, but always at the same time as an end.",
      by: "Immanuel Kant, 1785",
      link: "That is why your information is not something we sell, trade or rent.",
    },
    plain: [
      "We collect basic visit details (IP, browser, pages) and what you choose to give us, like your email.",
      "We never collect bank, card or UPI details.",
      "We don't sell, trade or rent your personal information.",
      "No website is 100% secure. We take reasonable care.",
    ],
  },
  terms: {
    kicker: "THE AGREEMENT ON STAMP PAPER",
    object: "an agreement",
    margin: "like any agreement on stamp paper: two sides, one understanding.",
    thought: {
      kind: "LAW",
      text: "Pacta sunt servanda. Agreements must be kept.",
      by: "a principle of law since Roman times",
      link: "Using the site is your side of it. Keeping these terms honest is ours.",
    },
    plain: [
      "Reading and using the site is for personal, non-commercial use.",
      "Don't copy or republish our content without written permission.",
      "We try to be accurate, but verify on the official website before applying.",
      "These terms can change; using the site means you accept the current version.",
    ],
  },
  disclaimer: {
    kicker: "A MAP, NOT THE TERRITORY",
    object: "a map",
    margin: "we draw the map. the official notification is the ground you'll walk on.",
    thought: {
      kind: "SCIENCE",
      text: "A map is not the territory it represents, but, if correct, it has a similar structure to the territory, which accounts for its usefulness.",
      by: "Alfred Korzybski, 1931",
      link: "That is why every page here says: verify on the official website.",
    },
    plain: [
      "We are a private website, not a government body.",
      "Always confirm dates, fees and eligibility on the official site.",
      "We can't promise a job. Selection is done by the recruiting authority.",
      "We never charge money. Anyone asking for payment in our name is a fraud.",
    ],
  },
  cookies: {
    kicker: "THE CLOAKROOM TOKEN",
    object: "a cloakroom token",
    margin: "a cookie works like the brass token at a temple shoe-stand: show it, and they know which pair is yours.",
    thought: {
      kind: "HISTORY",
      text: "The name comes from \"magic cookie\", programmers' slang for a small token passed between programs. Lou Montulli brought the idea to the web in 1994 so a site could remember a visitor.",
      by: "a short history of the cookie",
      link: "Small, simple, and you can always hand the token back.",
    },
    plain: [
      "Cookies are small text files saved on your device.",
      "Essential ones keep the site working; others help with analytics, your preferences and ads (including Google AdSense).",
      "Accept or decline non-essential cookies from the banner.",
      "You can block or clear cookies any time in your browser.",
    ],
  },
  editorial: {
    kicker: "THE PROOF DESK",
    object: "a proof sheet",
    margin: "every date is checked against the original notification before it goes up.",
    thought: {
      kind: "SCIENCE",
      text: "The first principle is that you must not fool yourself, and you are the easiest person to fool.",
      by: "Richard Feynman, 1974",
      link: "So we check our work against the source, not against our memory.",
    },
    plain: [
      "Everything comes from official sources, and we link to them.",
      "Dates and eligibility are checked against the original notification.",
      "Spotted a mistake? Tell us. We review within 24 hours and note the correction.",
      "Advertisers have no say in what we publish.",
    ],
  },
  copyright: {
    kicker: "THE THUMB IMPRESSION",
    object: "a thumb impression",
    margin: "no two fingerprints are alike, not even an identical twin's. original work carries its maker's print the same way.",
    thought: {
      kind: "SCIENCE",
      text: "Fingerprint ridges form in the womb and stay the same for life. Even identical twins, who share their DNA, have different prints.",
      by: "dermatoglyphics, the study of skin ridges",
      link: "We respect the print on others' work, and ask the same for ours.",
    },
    plain: [
      "Our original writing, layouts and design belong to ChayanJobs.",
      "Government notices are public information; we link to the source.",
      "Reading, sharing, linking, and quoting short bits with credit: welcome.",
      "Republishing large parts, commercial use or copying our design: not without permission.",
    ],
  },
  dmca: {
    kicker: "BOTH SIDES OF THE SCALE",
    object: "a balance",
    margin: "a notice puts weight on one pan. a counter-notice lets the other side speak.",
    thought: {
      kind: "LAW",
      text: "Audi alteram partem. Hear the other side.",
      by: "a rule of natural justice, older than any copyright law",
      link: "That is why there is a notice, and also a counter-notice.",
    },
    plain: [
      "If your copyrighted work is on our site, send a written notice through Contact Us.",
      "Use the subject line \"DMCA Notice\" and include the six details listed below.",
      "If your material was removed by mistake, you can file a counter-notification.",
    ],
  },
}

const ALL: { key: LegalKey; label: string; href: string }[] = [
  { key: "privacy", label: "Privacy", href: "/privacy" },
  { key: "terms", label: "Terms", href: "/terms" },
  { key: "disclaimer", label: "Disclaimer", href: "/disclaimer" },
  { key: "cookies", label: "Cookies", href: "/cookie-policy" },
  { key: "editorial", label: "Editorial", href: "/editorial-policy" },
  { key: "copyright", label: "Copyright", href: "/copyright" },
  { key: "dmca", label: "DMCA", href: "/dmca" },
]

/* ───────────────────────── a clause ───────────────────────── */

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

/** One clause of the document. Numbered "§ n" by CSS, listed in the side index. */
export function Clause({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section id={slug(title)} data-clause={title} className="legal-clause">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

/* ───────────────────────── the objects ───────────────────────── */

const T = "'Courier Prime', ui-monospace, monospace"

function Diary() {
  return (
    <svg viewBox="0 0 220 200" className="h-full w-full" aria-hidden>
      <ellipse cx="110" cy="188" rx="80" ry="7" fill="rgb(0 0 0 / .12)" />
      <g transform="rotate(-5 110 100)">
        <rect x="58" y="26" width="112" height="150" rx="4" fill="oklch(93% 0.01 85)" />
        <rect x="50" y="22" width="112" height="152" rx="6" fill="oklch(40% 0.11 25)" />
        <rect x="50" y="22" width="16" height="152" rx="5" fill="oklch(32% 0.1 25)" />
        <rect x="82" y="52" width="62" height="34" rx="3" fill={PAPER} />
        <text x="113" y="74" textAnchor="middle" fontSize="13" fontWeight="700" fill={PAPER_INK} fontFamily={T}>DIARY</text>
        <path d="M80 140 h66" stroke="oklch(75% 0.08 80)" strokeWidth="1" strokeDasharray="2 3" />
        {/* strap and lock */}
        <rect x="138" y="96" width="46" height="22" rx="3" fill="oklch(28% 0.06 40)" />
        <path d="M168 96 v-9 a9 9 0 0 1 18 0 v9" fill="none" stroke="oklch(70% 0.12 85)" strokeWidth="5" />
        <rect x="162" y="94" width="30" height="27" rx="4" fill="oklch(76% 0.13 85)" stroke="oklch(55% 0.1 75)" />
        <circle cx="177" cy="104" r="3.5" fill="oklch(30% 0.05 60)" />
        <rect x="175.6" y="105" width="2.8" height="8" fill="oklch(30% 0.05 60)" />
      </g>
    </svg>
  )
}

function StampPaper() {
  return (
    <svg viewBox="0 0 220 200" className="h-full w-full" aria-hidden>
      <ellipse cx="110" cy="190" rx="80" ry="7" fill="rgb(0 0 0 / .12)" />
      <g transform="rotate(3 110 100)">
        <rect x="46" y="10" width="128" height="172" fill={PAPER} stroke="oklch(78% 0.02 80)" />
        <rect x="46" y="10" width="128" height="52" fill="oklch(86% 0.07 150)" />
        <path d="M46 62 h128" stroke="oklch(55% 0.1 155)" strokeWidth="2" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <circle key={i} cx={56 + i * 15} cy="18" r="4" fill="none" stroke="oklch(50% 0.1 155)" strokeWidth="1" />)}
        <circle cx="110" cy="38" r="15" fill="oklch(94% 0.04 150)" stroke="oklch(45% 0.1 155)" strokeWidth="1.5" />
        <text x="110" y="43" textAnchor="middle" fontSize="12" fontWeight="700" fill="oklch(35% 0.1 155)" fontFamily={T}>₹100</text>
        <text x="110" y="80" textAnchor="middle" fontSize="10" fontWeight="700" fill={PAPER_INK} fontFamily={T}>AGREEMENT</text>
        {[94, 104, 114, 124, 134].map((y, i) => <rect key={y} x="58" y={y} width={i % 2 ? 92 : 104} height="3" rx="1.5" fill="oklch(82% 0.02 80)" />)}
        <path d="M58 162 c6 -10 12 6 18 -4 s10 4 16 -2" fill="none" stroke="oklch(40% 0.13 255)" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M122 160 c5 -8 9 4 14 -5 s8 6 14 -1" fill="none" stroke="oklch(40% 0.13 255)" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M56 168 h42 M120 168 h42" stroke={PAPER_INK} strokeWidth="1" />
        <text x="77" y="177" textAnchor="middle" fontSize="7" fill={PAPER_INK} fontFamily={T}>YOU</text>
        <text x="141" y="177" textAnchor="middle" fontSize="7" fill={PAPER_INK} fontFamily={T}>US</text>
      </g>
    </svg>
  )
}

function FoldedMap() {
  return (
    <svg viewBox="0 0 220 200" className="h-full w-full" aria-hidden>
      <ellipse cx="110" cy="188" rx="86" ry="7" fill="rgb(0 0 0 / .12)" />
      <path d="M22 40 L74 28 L126 40 L178 28 V160 L126 172 L74 160 L22 172 Z" fill="oklch(93% 0.035 110)" stroke="oklch(70% 0.03 100)" />
      <path d="M74 28 V160 L126 172 V40 Z" fill="oklch(88% 0.04 110)" />
      <path d="M150 60 c-10 20 6 30 -6 46 s-24 18 -18 40" fill="none" stroke="oklch(62% 0.08 230)" strokeWidth="5" opacity=".7" />
      <path d="M36 140 C 60 120, 70 100, 96 96 S 140 70, 160 56" fill="none" stroke="oklch(50% 0.18 28)" strokeWidth="2.2" strokeDasharray="5 5" />
      <path d="M160 46 c-7 0 -11 5 -11 10 c0 8 11 16 11 16 s11 -8 11 -16 c0 -5 -4 -10 -11 -10 z" fill="oklch(50% 0.18 28)" />
      <circle cx="160" cy="56" r="3.5" fill={PAPER} />
      {/* compass */}
      <g transform="translate(176 150)">
        <circle r="24" fill={PAPER} stroke="oklch(55% 0.08 75)" strokeWidth="3" />
        <path d="M0 -17 L5 0 L0 17 L-5 0 Z" fill="oklch(50% 0.18 28)" />
        <path d="M0 0 L5 0 L0 17 L-5 0 Z" fill="oklch(35% 0.02 60)" />
        <text y="-19" textAnchor="middle" fontSize="7" fontWeight="700" fill={PAPER_INK} fontFamily={T} dy="-1">N</text>
      </g>
    </svg>
  )
}

function Tokens() {
  return (
    <svg viewBox="0 0 220 200" className="h-full w-full" aria-hidden>
      <ellipse cx="110" cy="190" rx="80" ry="7" fill="rgb(0 0 0 / .12)" />
      {/* hook rail */}
      <rect x="20" y="20" width="180" height="10" rx="3" fill="oklch(45% 0.06 55)" />
      {[
        { x: 70, n: "42", r: -6, len: 46 },
        { x: 150, n: "17", r: 8, len: 70 },
      ].map((t) => (
        <g key={t.n} transform={`rotate(${t.r} ${t.x} 30)`}>
          <path d={`M${t.x} 30 V ${30 + t.len}`} stroke="oklch(50% 0.04 60)" strokeWidth="1.6" />
          <circle cx={t.x} cy={30 + t.len + 34} r="34" fill="oklch(75% 0.12 80)" stroke="oklch(55% 0.1 70)" strokeWidth="3" />
          <circle cx={t.x} cy={30 + t.len + 34} r="27" fill="none" stroke="oklch(60% 0.1 75)" strokeWidth="1" />
          <circle cx={t.x} cy={30 + t.len + 8} r="4" fill="oklch(97% 0.01 90)" stroke="oklch(55% 0.1 70)" />
          <text x={t.x} y={30 + t.len + 46} textAnchor="middle" fontSize="26" fontWeight="900" fill="oklch(35% 0.06 60)" fontFamily="Georgia, serif">{t.n}</text>
        </g>
      ))}
    </svg>
  )
}

function ProofSheet() {
  return (
    <svg viewBox="0 0 220 200" className="h-full w-full" aria-hidden>
      <ellipse cx="110" cy="190" rx="80" ry="7" fill="rgb(0 0 0 / .12)" />
      <g transform="rotate(-4 110 100)">
        <rect x="40" y="14" width="128" height="168" fill={PAPER} stroke="oklch(78% 0.02 80)" />
        <text x="54" y="36" fontSize="10" fontWeight="700" fill={PAPER_INK} fontFamily={T}>PROOF · CHECK</text>
        {[52, 66, 80, 94, 108, 122, 136, 150].map((y, i) => <rect key={y} x="54" y={y} width={[96, 88, 100, 74, 94, 82, 98, 60][i]} height="4" rx="2" fill="oklch(80% 0.02 80)" />)}
        {/* proofreader's marks */}
        <path d="M60 68 h40" stroke="oklch(50% 0.18 28)" strokeWidth="2" />
        <path d="M108 98 l5 -8 l5 8" fill="none" stroke="oklch(50% 0.18 28)" strokeWidth="2" />
        <ellipse cx="96" cy="124" rx="24" ry="8" fill="none" stroke="oklch(50% 0.18 28)" strokeWidth="1.8" />
        <text x="174" y="72" fontSize="12" fill="oklch(50% 0.18 28)" fontFamily="cursive">✓ src</text>
      </g>
      {/* magnifying glass */}
      <g transform="translate(150 130) rotate(-30)">
        <rect x="-5" y="30" width="10" height="44" rx="4" fill="oklch(35% 0.06 50)" />
        <circle r="32" fill="oklch(90% 0.03 220 / .45)" stroke="oklch(45% 0.03 60)" strokeWidth="6" />
        <path d="M-18 -14 a22 22 0 0 1 14 -10" stroke="white" strokeWidth="3" fill="none" opacity=".8" />
      </g>
    </svg>
  )
}

function Thumbprint() {
  return (
    <svg viewBox="0 0 220 200" className="h-full w-full" aria-hidden>
      <ellipse cx="110" cy="190" rx="80" ry="7" fill="rgb(0 0 0 / .12)" />
      <g transform="rotate(2 110 100)">
        <rect x="34" y="14" width="152" height="168" fill={PAPER} stroke="oklch(78% 0.02 80)" />
        <text x="48" y="34" fontSize="9" fontWeight="700" fill={PAPER_INK} fontFamily={T}>LEFT THUMB IMPRESSION</text>
        <rect x="68" y="44" width="84" height="104" fill="none" stroke={PAPER_INK} strokeWidth="1" strokeDasharray="3 3" />
        <g transform="translate(110 98) rotate(-10)" fill="none" stroke="oklch(42% 0.14 280)" strokeLinecap="round" opacity=".85">
          {[6, 11, 16, 21, 26, 31, 36].map((r, i) => (
            <ellipse key={r} rx={r * 0.78} ry={r} strokeWidth="2.2" strokeDasharray={i % 2 ? "22 4 14 5" : "30 5 9 4"} />
          ))}
          <path d="M-4 -2 c4 -6 10 -2 8 4" strokeWidth="2" />
        </g>
        <path d="M60 166 h100" stroke={PAPER_INK} strokeWidth="1" />
        <text x="110" y="176" textAnchor="middle" fontSize="7" fill={PAPER_INK} fontFamily={T}>ORIGINAL · ONE OF ONE</text>
      </g>
    </svg>
  )
}

function Balance() {
  const brass = "oklch(70% 0.12 80)"
  return (
    <svg viewBox="0 0 220 200" className="h-full w-full" aria-hidden>
      <ellipse cx="110" cy="190" rx="70" ry="7" fill="rgb(0 0 0 / .12)" />
      <rect x="80" y="176" width="60" height="10" rx="3" fill="oklch(45% 0.06 55)" />
      <rect x="106" y="40" width="8" height="138" fill={brass} />
      <circle cx="110" cy="38" r="8" fill={brass} stroke="oklch(55% 0.1 75)" />
      <g transform="rotate(-6 110 46)">
        <rect x="30" y="44" width="160" height="5" rx="2.5" fill={brass} />
        {[
          { x: 38, l: "NOTICE" },
          { x: 182, l: "COUNTER" },
        ].map((p) => (
          <g key={p.l}>
            <path d={`M${p.x} 48 L${p.x - 20} 108 M${p.x} 48 L${p.x + 20} 108`} stroke="oklch(55% 0.06 70)" strokeWidth="1.2" />
            <path d={`M${p.x - 26} 108 q26 18 52 0 z`} fill={brass} stroke="oklch(55% 0.1 75)" />
            <rect x={p.x - 18} y="88" width="36" height="22" fill={PAPER} stroke="oklch(75% 0.02 80)" transform={`rotate(${p.l === "NOTICE" ? -6 : 6} ${p.x} 98)`} />
            <text x={p.x} y="102" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={PAPER_INK} fontFamily={T} transform={`rotate(${p.l === "NOTICE" ? -6 : 6} ${p.x} 98)`}>{p.l}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

const OBJECTS: Record<LegalKey, () => ReactNode> = {
  privacy: Diary,
  terms: StampPaper,
  disclaimer: FoldedMap,
  cookies: Tokens,
  editorial: ProofSheet,
  copyright: Thumbprint,
  dmca: Balance,
}

/* ───────────────────────── the page ───────────────────────── */

export function LegalPaper({ kind, title, updated, children }: { kind: LegalKey; title: string; updated?: string; children: ReactNode }) {
  const skin = SKINS[kind]
  const Obj = OBJECTS[kind]
  const fontVars = { "--legal-hand": handFont.style.fontFamily, "--legal-type": typeFont.style.fontFamily } as CSSProperties

  return (
    <div className="home-saas mx-auto max-w-6xl px-4 pb-20 pt-8 sm:pt-10" style={fontVars}>
      {/* ── the object and the title ── */}
      <header className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          <p className={cn(typeFont.className, "text-[11px] font-bold tracking-[0.3em] text-[var(--color-brick)]")}>THE FINE PRINT · {skin.kicker}</p>
          <h1 className="mt-3 font-display text-[2.4rem] font-black leading-[1.03] text-foreground sm:text-[3.3rem]">{title}</h1>
          <p className={cn(handFont.className, "mt-3 max-w-2xl text-[1.3rem] leading-snug text-foreground/80")}>{skin.margin}</p>
          {updated ? (
            <p
              className={cn(typeFont.className, "mt-5 inline-block -rotate-[2deg] rounded-[4px] border-2 border-[oklch(46%_0.13_255)] px-2.5 py-0.5 text-[12px] font-bold uppercase text-[oklch(46%_0.13_255)] dark:border-[oklch(72%_0.11_255)] dark:text-[oklch(72%_0.11_255)]")}
            >
              {updated}
            </p>
          ) : null}
        </div>
        <div className="mx-auto h-[200px] w-[220px] md:h-[220px] md:w-[240px]">
          <Obj />
        </div>
      </header>

      {/* ── the idea, and the plain words ── */}
      <div className="mt-10 grid gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <figure className="relative rounded-[4px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] px-6 pb-5 pt-6 sm:px-8" style={{ boxShadow: paperShadow }}>
          <span className={cn(typeFont.className, "absolute -top-3 left-6 rounded-[3px] bg-foreground px-2 py-0.5 text-[10px] font-bold tracking-[0.25em] text-background")}>
            WHY · {skin.thought.kind}
          </span>
          <span className="absolute right-5 top-1 font-display text-[4.5rem] leading-none text-[var(--color-brick)] opacity-25" aria-hidden>“</span>
          <blockquote className="font-display text-[1.25rem] font-semibold leading-snug text-foreground sm:text-[1.4rem]">{skin.thought.text}</blockquote>
          <figcaption className={cn(typeFont.className, "mt-3 text-[12px] text-muted-foreground")}>— {skin.thought.by}</figcaption>
          <p className={cn(handFont.className, "mt-4 border-t border-dashed border-[var(--hs-border-strong)] pt-3 text-[1.15rem] leading-snug text-[var(--color-brick)]")}>
            → {skin.thought.link}
          </p>
        </figure>

        <aside aria-label="In plain words" className="relative rotate-[1deg] px-6 pb-5 pt-7 text-[oklch(27%_0.03_60)]" style={{ background: STICKY, boxShadow: "0 1px 2px rgb(60 40 10 / .1), 0 18px 26px -18px rgb(60 40 10 / .55)" }}>
          <span className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-[3deg] bg-[oklch(92%_0.02_90/0.75)] shadow-[0_1px_2px_rgb(0_0_0/.12)]" aria-hidden />
          <p className={cn(handFont.className, "text-[1.35rem] leading-none")}>in plain words:</p>
          <ul className="mt-3 space-y-2">
            {skin.plain.map((line) => (
              <li key={line} className={cn(handFont.className, "flex gap-2 text-[1.05rem] leading-snug")}>
                <span aria-hidden className="shrink-0">•</span>
                {line}
              </li>
            ))}
          </ul>
          <p className={cn(typeFont.className, "mt-4 text-[10.5px] font-bold uppercase tracking-[0.12em] opacity-70")}>A summary. The full text below is what counts.</p>
        </aside>
      </div>

      {/* ── the document ── */}
      <div className="mt-12 grid items-start gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
        <div className="hidden lg:sticky lg:top-24 lg:block">
          <ClauseIndex />
        </div>
        <article className="legal-doc legal-sheet rounded-[4px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] px-5 py-4 sm:pl-[4rem] sm:pr-10" style={{ boxShadow: paperShadow }}>
          {children}
          <p className={cn(handFont.className, "mt-6 border-t-2 border-double border-[var(--hs-border-strong)] pt-4 text-right text-[1.15rem] text-muted-foreground")}>
            written by people, for people. — the ChayanJobs desk
          </p>
        </article>
      </div>

      {/* ── the rest of the file: folder tabs ── */}
      <nav aria-label="Other policies" className="mt-14">
        <p className={cn(handFont.className, "text-[1.2rem] text-muted-foreground")}>the rest of the fine print:</p>
        <div className="mt-3 flex flex-wrap items-end gap-1.5 border-b-2 border-[var(--hs-border-strong)]">
          {ALL.map((p) => {
            const on = p.key === kind
            return (
              <Link
                key={p.key}
                href={p.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "rounded-t-[8px] border border-b-0 px-4 text-[13.5px] font-semibold transition-all",
                  on
                    ? "border-[var(--hs-border-strong)] bg-[var(--hs-paper-slip)] pb-2.5 pt-3 text-foreground"
                    : "border-[var(--hs-border)] bg-[var(--hs-surface)] pb-1.5 pt-2 text-muted-foreground hover:pb-2.5 hover:text-foreground",
                )}
              >
                {p.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
