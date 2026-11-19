import Link from "next/link"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { HandTick, Tape } from "@/components/desk/DeskKit"

// kept here (not imported) because DeskKit is a client module and this page is a server component
const paperShadow = "0 1px 2px rgb(60 40 10 / .08), 0 16px 28px -22px rgb(60 40 10 / .55)"
import "@/app/home.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
 title: "About Us",
 description: "Learn about ChayanJobs - India's trusted platform for government job notifications, exam results, admit cards, and career resources.",
 openGraph: {
  title: "About ChayanJobs",
  description: "Learn about India's trusted government job portal connecting millions with Sarkari career opportunities.",
 },
}

/*
 * The about page is a reading room: a letter from the desk, a pledge framed
 * on the wall, the card catalogue of what we keep, and the route every
 * notice takes before it reaches you. Same words as before, new room.
 */

const CATALOGUE = [
 { call: "JOB · 001", title: "Job Notifications", href: "/jobs", text: "Latest recruitment notifications from all major government departments and PSUs." },
 { call: "RES · 002", title: "Exam Results", href: "/results", text: "Quick access to examination results with direct links to official merit lists." },
 { call: "ADM · 003", title: "Admit Cards", href: "/admit-cards", text: "Download links for hall tickets and admit cards as soon as they are released." },
 { call: "KEY · 004", title: "Answer Keys", href: "/answer-keys", text: "Official answer keys for conducted examinations to estimate your score." },
 { call: "SYL · 005", title: "Syllabus", href: "/syllabus", text: "Detailed exam syllabus and preparation guides for competitive examinations." },
 { call: "NOT · 006", title: "Notifications", href: "/notifications", text: "Important announcements including exam dates, application deadlines, and changes." },
]

const PLEDGE = [
 "Provide timely and accurate government job notifications",
 "Simplify access to exam results, admit cards, and answer keys",
 "Offer comprehensive syllabus and preparation resources",
 "Ensure transparency by linking directly to official sources",
]

const ROUTE = [
 { step: "The official notice", note: "department site, gazette, Employment News" },
 { step: "We read it", note: "every line, dates and fees" },
 { step: "Checked against source", note: "the link goes back to the original" },
 { step: "On your desk", note: "clear, organised, on time" },
]

function Kicker({ children }: { children: React.ReactNode }) {
 return <p className={cn(typeFont.className, "text-[11px] font-bold tracking-[0.3em] text-[var(--color-brick)]")}>{children}</p>
}

export default function AboutPage() {
 return (
  <div className="home-saas mx-auto max-w-6xl px-4 pb-20 pt-10 sm:pt-14">
   {/* ── hero: a letter from the desk ── */}
   <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
    <div className="lg:pt-6">
     <Kicker>ABOUT US · हमारे बारे में</Kicker>
     <h1 className="mt-3 font-display text-[2.6rem] font-black leading-[1.03] text-foreground sm:text-[3.4rem]">About ChayanJobs</h1>
     <p className={cn(handFont.className, "mt-3 text-[1.45rem] leading-snug text-foreground/80")}>
      we read the notices so you don&apos;t miss a line of them.
     </p>
     <div className="mt-8 hidden lg:block" aria-hidden>
      <ReadingLamp />
     </div>
    </div>

    <section aria-labelledby="who-we-are" className="relative">
     <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-[-2deg]" />
     <div className="rotate-[0.4deg] rounded-[3px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] px-7 pb-8 pt-9 sm:px-10" style={{ boxShadow: paperShadow }}>
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-double border-[var(--hs-border-strong)] pb-3">
       <h2 id="who-we-are" className="font-display text-[1.6rem] font-black text-foreground">Who We Are</h2>
       <span className={cn(typeFont.className, "text-[10.5px] text-muted-foreground")}>FROM THE DESK OF CHAYANJOBS</span>
      </div>
      <p className={cn(handFont.className, "mt-5 text-[1.25rem] text-foreground/80")}>Dear aspirant,</p>
      <p className="mt-2 text-[15.5px] leading-[1.8] text-foreground">
       ChayanJobs is a comprehensive online platform dedicated to providing the latest information on
       government job opportunities across India. We aggregate job notifications from various central and
       state government departments, public sector undertakings, and autonomous bodies to create a
       single, reliable source for Sarkari job seekers.
      </p>
      <p className="mt-4 text-[15.5px] leading-[1.8] text-foreground">
       Founded with the mission to bridge the information gap between aspiring candidates and government
       recruitment agencies, we serve millions of users every month who rely on us for accurate and timely
       updates on job openings, exam results, admit cards, answer keys, and syllabus.
      </p>
      <p className={cn(handFont.className, "mt-6 text-right text-[1.3rem] text-[var(--color-brick)]")}>— the ChayanJobs desk</p>
     </div>
    </section>
   </div>

   {/* ── mission: the pledge framed on the wall ── */}
   <section aria-labelledby="our-mission" className="mt-24 flex flex-col items-center">
    <span className="h-3 w-3 rounded-full bg-[oklch(55%_0.02_70)] shadow-[0_1px_2px_rgb(0_0_0/.4)]" aria-hidden />
    <svg viewBox="0 0 300 30" className="-mt-1 h-[30px] w-[300px]" aria-hidden>
     <path d="M150 2 L 30 29 M150 2 L 270 29" stroke="oklch(55% 0.04 60)" strokeWidth="1.5" fill="none" />
    </svg>
    <div className="w-full max-w-3xl rounded-[4px] p-3 sm:p-4" style={{ background: "linear-gradient(135deg, oklch(45% 0.07 50), oklch(36% 0.06 45))", boxShadow: "0 26px 40px -26px rgb(40 20 0 / .7)" }}>
     <div className="border-[3px] border-double border-[oklch(70%_0.08_80)] bg-[oklch(97%_0.015_85)] px-6 py-9 text-center text-[oklch(27%_0.03_60)] sm:px-12">
      <p className={cn(typeFont.className, "text-[10.5px] font-bold tracking-[0.35em] opacity-70")}>OUR PLEDGE</p>
      <h2 id="our-mission" className="mt-2 font-display text-[2rem] font-black">Our Mission</h2>
      <p className="mx-auto mt-3 max-w-xl text-[15.5px] leading-relaxed">
       Our mission is to empower every Indian citizen with equal access to government employment
       opportunities. We strive to simplify the job search process by presenting clear, organized, and
       up-to-date information in a user-friendly format.
      </p>
      <ul className="mx-auto mt-6 max-w-lg space-y-3 text-left">
       {PLEDGE.map((p) => (
        <li key={p} className="flex gap-3 text-[15px] leading-snug">
         <HandTick className="mt-0.5 h-5 w-6 shrink-0 text-[oklch(42%_0.11_155)]" />
         {p}
        </li>
       ))}
      </ul>
      <p className={cn(handFont.className, "mt-7 text-[1.2rem] text-[oklch(45%_0.17_28)]")}>signed, and meant.</p>
     </div>
    </div>
   </section>

   {/* ── what we offer: the card catalogue ── */}
   <section aria-labelledby="what-we-offer" className="mt-24">
    <div className="flex flex-wrap items-end justify-between gap-3">
     <div>
      <Kicker>THE CARD CATALOGUE</Kicker>
      <h2 id="what-we-offer" className="mt-2 font-display text-[2rem] font-black leading-tight text-foreground">What We Offer</h2>
     </div>
     <p className={cn(handFont.className, "text-[1.15rem] text-muted-foreground")}>pull a card, it opens the drawer.</p>
    </div>
    <div className="mt-8 rounded-[8px] p-3 sm:p-4" style={{ background: "linear-gradient(180deg, oklch(46% 0.07 52), oklch(38% 0.06 48))", boxShadow: "inset 0 1px 0 oklch(62% 0.07 55), 0 24px 36px -26px rgb(40 20 0 / .65)" }}>
     <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {CATALOGUE.map((c, i) => (
       <li key={c.title}>
        <Link
         href={c.href}
         className={cn(
          "group relative block h-full rounded-[3px] bg-[oklch(97%_0.012_85)] px-5 pb-9 pt-4 text-[oklch(27%_0.03_60)] shadow-[0_3px_6px_-3px_rgb(0_0_0/.5)] transition-transform duration-300 hover:-translate-y-1.5",
          i % 3 === 1 ? "rotate-[0.6deg]" : i % 3 === 2 ? "-rotate-[0.5deg]" : "",
         )}
        >
         <div className="flex items-baseline justify-between border-b border-[oklch(62%_0.16_25/0.55)] pb-1.5">
          <span className={cn(typeFont.className, "text-[11px] font-bold")}>{c.call}</span>
          <span className={cn(typeFont.className, "text-[10px] opacity-60")}>CHAYANJOBS LIB.</span>
         </div>
         <h3 className="mt-3 font-display text-[1.2rem] font-black group-hover:text-[oklch(45%_0.17_28)]">{c.title}</h3>
         <p className={cn(typeFont.className, "mt-1.5 text-[12.5px] leading-relaxed opacity-85")}>{c.text}</p>
         {/* the rod hole every catalogue card has */}
         <span className="absolute bottom-3 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full shadow-[inset_0_1px_2px_rgb(0_0_0/.45)]" style={{ background: "oklch(34% 0.05 48)" }} aria-hidden />
        </Link>
       </li>
      ))}
     </ul>
    </div>
   </section>

   {/* ── why trust us: the route a notice takes ── */}
   <section aria-labelledby="why-trust-us" className="mt-24 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <div>
     <Kicker>HOW A NOTICE REACHES YOU</Kicker>
     <h2 id="why-trust-us" className="mt-2 font-display text-[2rem] font-black leading-tight text-foreground">Why Trust Us</h2>
     <p className="mt-4 text-[15.5px] leading-[1.8] text-foreground">
      We understand the importance of accurate information when it comes to your career. Every
      notification published on our platform is verified against official government sources including
      departmental websites and the Employment News. We do not create or modify job listings - we
      simply aggregate and organize publicly available information for your convenience.
     </p>
     <p className="mt-4 text-[15.5px] leading-[1.8] text-foreground">
      Our team continuously monitors official sources to ensure that you never miss an important update.
      We clearly mark the source of every notification so you can always verify details on the official
      website before applying.
     </p>
    </div>
    <ol className="relative self-center pl-2">
     <span className="absolute bottom-6 left-[27px] top-6 border-l-2 border-dashed border-[var(--hs-border-strong)]" aria-hidden />
     {ROUTE.map((r, i) => (
      <li key={r.step} className="relative flex items-start gap-5 py-3">
       <span className={cn("relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[2.5px] font-display text-[1rem] font-black", i === ROUTE.length - 1 ? "border-[oklch(45%_0.11_155)] bg-[oklch(45%_0.11_155)] text-[oklch(98%_0.01_90)]" : "border-foreground/70 bg-background text-foreground")}>
        {i + 1}
       </span>
       <div className="pt-1">
        <p className="text-[16px] font-semibold text-foreground">{r.step}</p>
        <p className={cn(handFont.className, "text-[1.05rem] text-muted-foreground")}>{r.note}</p>
       </div>
      </li>
     ))}
    </ol>
   </section>

   {/* ── a postcard to write back ── */}
   <div className="mx-auto mt-24 max-w-2xl">
    <div className="relative -rotate-[0.6deg] rounded-[4px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] px-7 py-8 sm:px-10" style={{ boxShadow: paperShadow }}>
     <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="sm:border-r sm:border-dashed sm:border-[var(--hs-border-strong)] sm:pr-8">
       <p className={cn(typeFont.className, "text-[10.5px] font-bold tracking-[0.3em] text-muted-foreground")}>POST CARD</p>
       <p className="mt-2 text-[16px] leading-relaxed text-foreground">
        Have questions or feedback? We would love to hear from you.
       </p>
       <p className={cn(handFont.className, "mt-1 text-[1.15rem] text-[var(--color-brick)]")}>even the small things. especially those.</p>
      </div>
      <Link
       href="/contact"
       className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
      >
       Contact Us <span aria-hidden>→</span>
      </Link>
     </div>
    </div>
   </div>
  </div>
 )
}

/** A desk lamp over a stack of newspapers, the way most mornings start. */
function ReadingLamp() {
 return (
  <svg viewBox="0 0 320 220" className="h-[220px] w-[320px]">
   <ellipse cx="170" cy="210" rx="140" ry="8" fill="rgb(0 0 0 / .1)" />
   {/* glow */}
   <path d="M118 70 L 40 205 L 250 205 L 178 70 Z" fill="oklch(90% 0.09 90 / .35)" />
   {/* papers */}
   <rect x="70" y="182" width="190" height="14" rx="2" fill="oklch(92% 0.02 85)" stroke="oklch(70% 0.03 75)" />
   <rect x="80" y="170" width="170" height="14" rx="2" fill="oklch(95% 0.015 85)" stroke="oklch(70% 0.03 75)" transform="rotate(-2 165 177)" />
   <rect x="88" y="150" width="150" height="22" rx="2" fill="oklch(97% 0.01 85)" stroke="oklch(70% 0.03 75)" transform="rotate(3 163 161)" />
   <text x="96" y="166" fontSize="10" fontWeight="700" fill="oklch(30% 0.03 60)" fontFamily="'Courier Prime', monospace" transform="rotate(3 163 161)">EMPLOYMENT NEWS</text>
   <ellipse cx="200" cy="160" rx="22" ry="8" fill="none" stroke="oklch(48% 0.18 28)" strokeWidth="2" transform="rotate(3 163 161)" />
   {/* lamp */}
   <rect x="262" y="196" width="46" height="8" rx="3" fill="oklch(35% 0.03 60)" />
   <path d="M285 196 L 268 120 L 200 74" stroke="oklch(35% 0.03 60)" strokeWidth="6" fill="none" strokeLinecap="round" />
   <circle cx="268" cy="120" r="6" fill="oklch(35% 0.03 60)" />
   <path d="M210 52 L 150 64 L 168 96 L 222 70 Z" fill="oklch(45% 0.13 155)" />
   <circle cx="160" cy="82" r="7" fill="oklch(95% 0.1 95)" />
  </svg>
 )
}
