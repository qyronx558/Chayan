import Link from "next/link"
import { Mail, MapPin } from "lucide-react"
import { Newsletter } from "@/components/layout/Newsletter"
import { BackToTop } from "@/components/layout/BackToTop"
import { TourReplayButton } from "@/components/onboarding/TourReplayButton"
import { siteConfig, footerLinks, trendingTags, exploreFooterLinks } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { handFont } from "@/components/home/fonts"

/*
 * The footer is the back cover of an Indian exercise book: the page above
 * tears off into it, the "Name / Subject / School" label is filled in by
 * hand, column headings are pencilled, and the big wordmark is a signature.
 */
const MARIGOLD = "oklch(82% 0.13 80)"

const importantLinks = [
 { label: "Privacy Policy", href: "/privacy" },
 { label: "Terms of Service", href: "/terms" },
 { label: "Disclaimer", href: "/disclaimer" },
 { label: "Cookie Policy", href: "/cookie-policy" },
 { label: "Editorial Policy", href: "/editorial-policy" },
 { label: "Copyright Policy", href: "/copyright" },
 { label: "DMCA", href: "/dmca" },
 { label: "Blog", href: "/blog" },
 { label: "Help Centre", href: "/docs" },
 { label: "Contact Us", href: "/contact" },
 { label: "About Us", href: "/about" },
 { label: "Sitemap", href: "/sitemap" },
 { label: "RSS Feed", href: "/rss" },
]

function FooterHeading({ children }: { children: React.ReactNode }) {
 return (
  <h3 className={cn(handFont.className, "mb-4 text-[1.25rem] font-normal leading-none text-paper")}>
   {children}
   <svg viewBox="0 0 120 8" className="mt-1.5 block h-2 w-24" preserveAspectRatio="none" aria-hidden>
    <path d="M2 5 C 25 2, 55 7, 80 4 S 112 3, 118 5" fill="none" stroke={MARIGOLD} strokeWidth="2" strokeLinecap="round" opacity=".75" />
   </svg>
  </h3>
 )
}

/* One row of the printed name label on an exercise book. */
function LabelRow({ k, v }: { k: string; v: string }) {
 return (
  <div className="flex items-end gap-2 border-b border-[oklch(62%_0.09_240/.45)] pb-0.5">
   <span className="w-[4.2rem] shrink-0 text-[10px] font-semibold text-[oklch(45%_0.08_245)]">{k}</span>
   <span className={cn(handFont.className, "min-w-0 truncate text-[1.05rem] leading-tight text-[oklch(28%_0.06_255)]")}>{v}</span>
  </div>
 )
}

function FooterLink({ href, label }: { href: string; label: string }) {
 return (
  <li>
   <Link
    href={href}
    className="text-sm text-paper/70 underline decoration-paper/25 max-sm:inline-block max-sm:py-1 decoration-1 underline-offset-4 transition-colors hover:text-paper hover:decoration-paper/70"
   >
    {label}
   </Link>
  </li>
 )
}

export function Footer({ className }: { className?: string }) {
 const currentYear = new Date().getFullYear()

 return (
  <footer className={cn("relative mt-20 w-full max-w-[100vw] overflow-x-clip bg-ink text-paper", className)}>
   {/* the page above ends in a torn edge */}
   <svg className="pointer-events-none absolute inset-x-0 -top-px h-4 w-full text-background" viewBox="0 0 1200 16" preserveAspectRatio="none" aria-hidden>
    <path
     d="M0 0 H1200 V7 L1176 12 L1150 6 L1122 13 L1096 8 L1070 14 L1041 7 L1013 12 L987 6 L958 13 L931 8 L904 12 L876 5 L849 13 L822 9 L795 14 L766 6 L739 12 L712 7 L684 13 L657 8 L630 14 L602 6 L575 11 L548 7 L520 13 L493 8 L466 12 L438 5 L411 13 L384 9 L357 14 L329 7 L302 12 L275 6 L247 13 L220 8 L193 12 L165 6 L138 14 L111 8 L84 13 L56 7 L29 12 L0 8 Z"
     fill="currentColor"
    />
   </svg>
   <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
    <div className="grid min-w-0 gap-10 max-sm:grid-cols-2 max-sm:gap-x-5 sm:grid-cols-2 lg:grid-cols-12">
     <div className="max-sm:col-span-2 sm:col-span-2 lg:col-span-4">
      {/* the name label every exercise book has on its cover */}
      <Link
       href="/"
       className="block max-w-sm -rotate-[1.2deg] rounded-[6px] border-2 border-[oklch(55%_0.1_245)] bg-[oklch(97%_0.01_90)] p-1 transition-transform hover:rotate-0"
       style={{ boxShadow: "0 10px 20px -12px rgb(0 0 0 / .6)" }}
      >
       <div className="rounded-[4px] border border-[oklch(55%_0.1_245/.6)] px-4 pb-3 pt-2">
        <p className="text-center font-display text-[1.35rem] font-bold leading-tight text-[oklch(22%_0.03_60)]">
         Chayan<span className="text-brick">Jobs</span>
        </p>
        <div className="mt-2 space-y-1.5">
         <LabelRow k="NAME" v="you, the aspirant" />
         <LabelRow k="SUBJECT" v="your next job" />
         <LabelRow k="MOTTO" v="select right. serve right." />
        </div>
       </div>
      </Link>
      <p className="mt-6 max-w-sm text-sm leading-relaxed text-paper/70">
       Government and private jobs, results, admit cards and answer keys, checked against official
       sources and kept in one calm place, for everyone who is still preparing.
      </p>
      <div className="mt-4 space-y-2 text-sm text-paper/70">
       <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-paper/50" aria-hidden />
        <span>New Delhi, India</span>
       </div>
       <div className="flex min-w-0 items-center gap-2">
        <Mail className="h-4 w-4 shrink-0 text-paper/50" aria-hidden />
        <span className="min-w-0 break-all">contact@chayanjobs.com</span>
       </div>
      </div>
      <Newsletter className="mt-4" variant="footer" />
      <div className="mt-3">
       <TourReplayButton />
      </div>
     </div>

     {footerLinks.map((section) => (
      <div key={section.title} className="lg:col-span-2">
       <FooterHeading>{section.title}</FooterHeading>
       <ul className="space-y-2.5">
        {section.links.map((link) => (
         <FooterLink key={link.label} href={link.href} label={link.label} />
        ))}
       </ul>
      </div>
     ))}
    </div>

    <div className="mt-12 min-w-0 border-t border-paper/15 pt-10">
     <div className="grid min-w-0 gap-10 max-sm:grid-cols-2 max-sm:gap-x-5 sm:grid-cols-2 lg:grid-cols-5">
      <div>
       <FooterHeading>Trending Searches</FooterHeading>
       <ul className="space-y-2.5">
        {trendingTags.map((tag) => (
         <FooterLink key={tag.label} href={tag.href} label={tag.label} />
        ))}
       </ul>
      </div>

      {exploreFooterLinks.map((section) => (
       <div key={section.title}>
        <FooterHeading>{section.title}</FooterHeading>
        <ul className="space-y-2.5">
         {section.links.map((link) => (
          <FooterLink key={link.label} href={link.href} label={link.label} />
         ))}
        </ul>
       </div>
      ))}
     </div>
    </div>

    {/* signed, like the last line of a letter */}
    <div className="flex flex-col items-center justify-center overflow-hidden border-b border-paper/15 pb-10 pt-12">
     <p className={cn(handFont.className, "text-[1.1rem] text-paper/55")}>with care, and a lot of chai,</p>
     <div className="relative mt-1 max-w-full">
      <span
       className={cn(handFont.className, "block -rotate-[2deg] text-center text-[clamp(3.2rem,15vw,8.5rem)] leading-[1.05] text-paper")}
      >
       ChayanJobs
      </span>
      <svg viewBox="0 0 400 30" className="mx-auto -mt-2 h-5 w-[78%] sm:h-7" preserveAspectRatio="none" aria-hidden>
       <path d="M6 18 C 80 6, 160 26, 240 14 S 360 4, 394 12 C 370 20, 340 26, 300 24" fill="none" stroke={MARIGOLD} strokeWidth="3" strokeLinecap="round" />
      </svg>
     </div>
    </div>

    <div className="my-6 flex flex-wrap justify-center gap-x-6 gap-y-2 max-sm:gap-x-4 max-sm:gap-y-0">
     {importantLinks.map((link) => (
      <Link
       key={link.label}
       href={link.href}
       className="text-xs text-paper/55 underline decoration-paper/20 max-sm:py-2.5 max-sm:text-[13px] decoration-1 underline-offset-4 transition-colors hover:text-paper hover:decoration-paper/60"
      >
       {link.label}
      </Link>
     ))}
    </div>

    <div className="border-t border-paper/15 pt-6">
     <div className="flex flex-col items-center gap-4 text-center">
      <div className="agate text-xs text-paper/55">
       <p>&copy; {currentYear} {siteConfig.name}. All rights reserved.</p>
       <p className="mt-1">
        Made in India, for every aspirant who keeps going. Last updated {new Date().toLocaleDateString("en-IN", {
         day: "numeric",
         month: "long",
         year: "numeric",
        })}
       </p>
      </div>
      <BackToTop />
     </div>
    </div>
   </div>
  </footer>
 )
}
