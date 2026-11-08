import Link from "next/link"
import { Mail, MapPin } from "lucide-react"
import { Newsletter } from "@/components/layout/Newsletter"
import { BackToTop } from "@/components/layout/BackToTop"
import { TourReplayButton } from "@/components/onboarding/TourReplayButton"
import { siteConfig, footerLinks, trendingTags, exploreFooterLinks } from "@/lib/constants"
import { cn } from "@/lib/utils"

const importantLinks = [
 { label: "Privacy Policy", href: "/privacy" },
 { label: "Terms of Service", href: "/terms" },
 { label: "Disclaimer", href: "/disclaimer" },
 { label: "Cookie Policy", href: "/cookie-policy" },
 { label: "Editorial Policy", href: "/editorial-policy" },
 { label: "Copyright Policy", href: "/copyright" },
 { label: "DMCA", href: "/dmca" },
 { label: "Blog", href: "/blog" },
 { label: "Contact Us", href: "/contact" },
 { label: "About Us", href: "/about" },
 { label: "Sitemap", href: "/sitemap" },
 { label: "RSS Feed", href: "/rss" },
]

function FooterHeading({ children }: { children: React.ReactNode }) {
 return (
  <h3 className="mb-4 border-b border-paper/20 pb-2 font-display text-base font-bold text-paper">
   {children}
  </h3>
 )
}

function FooterLink({ href, label }: { href: string; label: string }) {
 return (
  <li>
   <Link
    href={href}
    className="text-sm text-paper/70 underline decoration-paper/25 decoration-1 underline-offset-4 transition-colors hover:text-paper hover:decoration-paper/70"
   >
    {label}
   </Link>
  </li>
 )
}

export function Footer({ className }: { className?: string }) {
 const currentYear = new Date().getFullYear()

 return (
  <footer className={cn("mt-16 w-full max-w-[100vw] overflow-x-clip border-t border-rule-2 bg-ink text-paper", className)}>
   <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
    <div className="grid min-w-0 gap-10 sm:grid-cols-2 lg:grid-cols-12">
     <div className="sm:col-span-2 lg:col-span-4">
      <Link href="/" className="flex items-center gap-2.5">
       <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-paper/35">
        <svg viewBox="0 0 80 80" className="h-6 w-6" aria-hidden>
         <path d="M20 48 L30 58 L55 28" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="square" strokeLinejoin="miter" />
        </svg>
       </div>
       <div className="leading-tight">
        <div className="font-display text-2xl font-bold text-paper">ChayanJobs</div>
        <div className="agate text-[0.7rem] text-paper/60">select right. serve right.</div>
       </div>
      </Link>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/70">
       Your trusted government job portal. Latest notifications, results,
       admit cards, answer keys and more, all in one place.
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
     <div className="grid min-w-0 gap-10 sm:grid-cols-2 lg:grid-cols-5">
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

    <div className="flex items-center justify-center overflow-hidden border-b border-paper/15 py-12">
     <div className="max-w-full break-words text-center font-display text-6xl font-bold leading-none text-paper sm:text-8xl md:text-9xl">
      ChayanJobs
     </div>
    </div>

    <div className="my-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
     {importantLinks.map((link) => (
      <Link
       key={link.label}
       href={link.href}
       className="text-xs text-paper/55 underline decoration-paper/20 decoration-1 underline-offset-4 transition-colors hover:text-paper hover:decoration-paper/60"
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
        Made in India. Last updated {new Date().toLocaleDateString("en-IN", {
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
