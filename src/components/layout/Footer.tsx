import Link from "next/link"
import { Mail, MapPin, ChevronRight } from "lucide-react"
import { Newsletter } from "@/components/layout/Newsletter"
import { BackToTop } from "@/components/layout/BackToTop"
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
    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
      {children}
      <span className="mt-2 block h-0.5 w-8 rounded-full bg-teal-400" aria-hidden="true" />
    </h3>
  )
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-1 text-sm text-slate-300/90 transition-all duration-200 hover:translate-x-0.5 hover:text-teal-300"
      >
        <ChevronRight className="h-3.5 w-3.5 -ml-1 text-teal-400/0 transition-all duration-200 group-hover:ml-0 group-hover:text-teal-400/100" />
        {label}
      </Link>
    </li>
  )
}

export function Footer({ className }: { className?: string }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={cn("w-full max-w-[100vw] overflow-x-clip bg-[#0b1e33] text-slate-300", className)}>
      <div className="h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-amber-400" aria-hidden="true" />

      <div className="bg-gradient-to-b from-[#142f4d] to-[#0b1e33]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 min-w-0">
          <div className="grid min-w-0 gap-10 sm:grid-cols-2 lg:grid-cols-12">
            <div className="sm:col-span-2 lg:col-span-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500">
                  <svg viewBox="0 0 80 80" className="h-6 w-6">
                    <path d="M20 48 L30 58 L55 28" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <div className="text-2xl font-bold text-white">Chayan</div>
                  <div className="-mt-0.5 text-xs font-medium tracking-wider text-slate-400">select right. serve right.</div>
                </div>
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-slate-300/80">
                Your trusted government job portal. Latest notifications, results,
                admit cards, answer keys and more - all in one place.
              </p>
              <div className="mt-4 space-y-2 text-sm text-slate-300/80">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                  <span>New Delhi, India</span>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-teal-400" />
                  <span className="min-w-0 break-all">contact@chayanjobs.com</span>
                </div>
              </div>
              <Newsletter className="mt-4" variant="footer" />
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

          <div className="mt-12 min-w-0 border-t border-white/10 pt-10">
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

          <div className="flex items-center justify-center overflow-hidden py-10 min-w-0">
            <div className="max-w-full break-words text-center text-6xl font-bold leading-none tracking-[0.15em] text-white/95 sm:text-8xl md:text-9xl">Chayan</div>
          </div>

          <div className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {importantLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-slate-400 transition-colors hover:text-teal-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/10 pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="text-xs text-slate-400">
                <p>&copy; {currentYear} {siteConfig.name}. All rights reserved.</p>
                <p className="mt-1">
                  Made in India | Last updated: {new Date().toLocaleDateString("en-IN", {
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
      </div>
    </footer>
  )
}
