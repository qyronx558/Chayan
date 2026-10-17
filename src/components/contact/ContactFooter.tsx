import Link from "next/link"
import { LogoSmall } from "@/components/layout/LogoSmall"

const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Jobs", href: "/jobs" },
      { label: "Blog", href: "/blog" },
      { label: "Sitemap", href: "/sitemap" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "DMCA", href: "/dmca" },
    ],
  },
]

export function ContactFooter() {
  return (
    <footer className="border-t border-[var(--cp-border)]">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <LogoSmall />
          <p className="mt-3 max-w-[36ch] text-[14px] leading-relaxed text-[var(--cp-muted)]">
            Government job alerts, results, admit cards, and private jobs across India. Select right, serve right.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <p className="text-[13px] font-semibold text-[var(--cp-ink)]">{column.heading}</p>
            <ul className="mt-3 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-[var(--cp-muted)] transition-colors hover:text-[var(--cp-ink)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-[var(--cp-border)]">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-1 px-4 py-5 text-[13px] text-[var(--cp-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} ChayanJobs. All rights reserved.</p>
          <p>
            Support:{" "}
            <a href="mailto:support@chayanjobs.com" className="text-[var(--cp-link)] underline decoration-[var(--cp-link)]/40 underline-offset-4 hover:decoration-[var(--cp-link)]">
              support@chayanjobs.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
