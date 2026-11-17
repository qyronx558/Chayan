/* eslint-disable @next/next/no-img-element */
import Script from "next/script"
import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"
import { HandEyebrow, HandHeading, MarkedTitle } from "@/components/home/ui/HandTitle"

const DMCA_ID = "1af2b354-a6eb-4a01-8741-3217354eca7d"

/*
 * "Why trust us" as an office verification slip: a checklist ticked by hand
 * and an inked rubber stamp. Only claims the site already makes are listed.
 */

const CHECKS = [
  { title: "Link goes to the official portal", note: "never a copy, never a middleman" },
  { title: "Our own words, protected", note: "DMCA protected content" },
  { title: "Listed with Google News", note: "a recognised news publisher" },
  { title: "Your connection is encrypted", note: "SSL secured, end to end" },
]

function Tick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 24" className={className} fill="none" aria-hidden>
      <path
        d="M3 13.5 C 5.5 15, 8 18, 10 21 C 13 13, 18 7, 25 2.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Stamp() {
  return (
    <div
      className="pointer-events-none absolute -right-2 top-6 rotate-[-12deg] select-none mix-blend-multiply dark:mix-blend-screen sm:right-6"
      style={{ color: "var(--hs-stamp)", opacity: 0.78 }}
      aria-hidden
    >
      <svg width="132" height="132" viewBox="0 0 132 132">
        <defs>
          <path id="stamp-ring" d="M66 66 m-48 0 a48 48 0 1 1 96 0 a48 48 0 1 1 -96 0" />
          {/* slightly uneven ink */}
          <filter id="stamp-ink">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25" />
            <feComposite in="SourceGraphic" operator="in" />
          </filter>
        </defs>
        <g filter="url(#stamp-ink)" fill="none" stroke="currentColor">
          <circle cx="66" cy="66" r="60" strokeWidth="3" />
          <circle cx="66" cy="66" r="38" strokeWidth="1.5" />
          <text fontSize="10.5" fontWeight="700" letterSpacing="2.4" fill="currentColor" stroke="none">
            <textPath href="#stamp-ring" startOffset="2%">
              CHAYANJOBS DESK · VERIFIED · OFFICIAL SOURCE ·
            </textPath>
          </text>
          <text x="66" y="63" textAnchor="middle" fontSize="15" fontWeight="800" fill="currentColor" stroke="none">
            CHECKED
          </text>
          <text x="66" y="79" textAnchor="middle" fontSize="9" fontWeight="600" fill="currentColor" stroke="none">
            before publishing
          </text>
        </g>
      </svg>
    </div>
  )
}

export function TrustBadges({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative h-full overflow-hidden rounded-[6px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] p-6 sm:p-8 lg:rotate-[0.4deg]",
        className
      )}
      style={{ boxShadow: "0 1px 2px rgb(60 40 10 / .06), 0 22px 44px -32px rgb(60 40 10 / .4)" }}
    >
      <Script src="https://images.dmca.com/Badges/DMCABadgeHelper.min.js" strategy="lazyOnload" />
      <Stamp />

      {/* slip header, like a printed office form */}
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-double border-[var(--hs-border-strong)] pb-2 pr-24 text-[10px] text-muted-foreground sm:pr-32">
        <span className="font-semibold">VERIFICATION SLIP</span>
        <span className="font-mono">Form CJ-01</span>
      </div>

      <HandHeading className="mt-5">
        <HandEyebrow>why you can trust it</HandEyebrow>
        <h2 className="mt-2 pr-20 text-2xl font-bold leading-[1.25] text-foreground sm:pr-28 sm:text-[1.9rem]">
          <MarkedTitle title="Checked before it is published" mark="Checked" markStyle="circle" />
        </h2>
      </HandHeading>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        One wrong date can cost someone a year of preparation. So every notice goes through the same checks before it
        reaches you.
      </p>

      <ul className="mt-6 divide-y divide-dotted divide-[var(--hs-border-strong)] border-y border-dotted border-[var(--hs-border-strong)]">
        {CHECKS.map((c) => (
          <li key={c.title} className="flex items-center gap-4 py-3">
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-[var(--hs-border-strong)]">
              <Tick className="absolute -right-1.5 -top-2 h-7 w-8 text-[var(--hs-trust)]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[14.5px] font-semibold text-foreground">{c.title}</span>
              <span className={cn(handFont.className, "block text-[0.98rem] leading-tight text-foreground/55")}>{c.note}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* the actual seals, small, like stickers on the slip */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="text-[11px] text-muted-foreground">Seals:</span>
        <a
          href={`//www.dmca.com/Protection/Status.aspx?ID=${DMCA_ID}`}
          title="DMCA.com Protection Status"
          className="dmca-badge -rotate-[3deg] overflow-hidden rounded-[3px] border border-black/10 bg-white p-0.5 shadow-[0_2px_4px_rgb(0_0_0/.12)]"
          rel="noopener noreferrer"
        >
          <img
            src={`https://images.dmca.com/Badges/dmca-badge-w100-1x1-01.png?ID=${DMCA_ID}`}
            alt="DMCA.com Protection Status"
            width={34}
            height={34}
            loading="lazy"
          />
        </a>
        <span className="rotate-[2deg] overflow-hidden rounded-[3px] border border-black/10 bg-white p-0.5 shadow-[0_2px_4px_rgb(0_0_0/.12)]">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4EXCMVIgNmAFxWlQJ4GjuYHWDFsZ7Nu1TuoGiplzucQ&s=10"
            alt="Google News Approved"
            width={34}
            height={34}
            loading="lazy"
          />
        </span>
        <span className="-rotate-[1deg] overflow-hidden rounded-[3px] border border-black/10 bg-white p-0.5 shadow-[0_2px_4px_rgb(0_0_0/.12)]">
          <img
            src="https://t4.ftcdn.net/jpg/14/95/32/55/360_F_1495325523_nKpftTrWkLaQP6c6wZId8f10LmSpO5ZS.jpg"
            alt="SSL Secure"
            width={34}
            height={34}
            loading="lazy"
            className="h-[34px] w-[34px] object-cover"
          />
        </span>
        <span className={cn(handFont.className, "ml-auto text-[1.05rem] text-foreground/60")}>— the desk</span>
      </div>
    </div>
  )
}
