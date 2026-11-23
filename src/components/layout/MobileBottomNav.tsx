"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Briefcase, Building2, Award, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

const ITEMS = [
 { label: "Home", href: "/", icon: Home, match: (p: string) => p === "/" },
 {
  label: "Gov Jobs",
  href: "/jobs",
  icon: Briefcase,
  match: (p: string) => p.startsWith("/jobs") || p.startsWith("/apply/") || p.startsWith("/category/"),
 },
 {
  label: "Private Jobs",
  href: "/private-jobs",
  icon: Building2,
  match: (p: string) => p.startsWith("/private-jobs") || p.startsWith("/companies"),
 },
 {
  label: "Results",
  href: "/results",
  icon: Award,
  match: (p: string) => p.startsWith("/results") || p.startsWith("/result/"),
 },
 {
  label: "Admit Card",
  href: "/admit-cards",
  icon: CreditCard,
  match: (p: string) => p.startsWith("/admit-card"),
 },
] as const

/**
 * Detail pages that already pin their own action bar (Apply / Download /
 * Official site) to the bottom of the screen, plus pages with their own
 * fixed bottom bar. The bottom nav steps aside there so the two never stack.
 */
export function hasOwnBottomBar(pathname: string): boolean {
 if (pathname === "/profile") return true
 if (/^\/(apply|result|admit-card|answer-key|admission)\/[^/]+$/.test(pathname)) return true
 // /syllabus/[slug] is a document page; /syllabus itself is a list
 if (/^\/syllabus\/[^/]+$/.test(pathname)) return true
 // /private-jobs/[slug] is a detail page; these sub-paths are listings
 const m = pathname.match(/^\/private-jobs\/([^/]+)$/)
 if (m && !["freshers", "remote", "walkins", "refer"].includes(m[1])) return true
 return false
}

/**
 * Phone-only bottom tab bar: the five sections people open most, each with a large icon and a plain one-word label so they can be
 * reached with one thumb and recognised without reading the full menu.
 * Hidden from md (768px) up, where the header navigation has room.
 */
export function MobileBottomNav() {
 const pathname = usePathname() || "/"
 if (hasOwnBottomBar(pathname)) return null

 return (
  <>
   {/* Spacer so the footer's last lines are never hidden behind the bar */}
   <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden print:hidden" />
   <nav
    aria-label="Quick navigation"
    data-mobile-bottom-nav
    className="fixed inset-x-0 bottom-0 z-40 border-t border-rule-2 bg-background pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
   >
    <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
     {ITEMS.map(({ label, href, icon: Icon, match }) => {
      const active = match(pathname)
      return (
       <li key={href} className="min-w-0">
        <Link
         href={href}
         aria-current={active ? "page" : undefined}
         className={cn(
          "flex h-full flex-col items-center justify-center gap-1 border-t-2 px-0.5 text-[11.5px] font-semibold leading-none transition-colors",
          active
           ? "border-brick text-brick"
           : "border-transparent text-muted-foreground active:bg-paper-2 active:text-foreground"
         )}
        >
         <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} aria-hidden />
         <span className="max-w-full text-center leading-[1.1]">{label}</span>
        </Link>
       </li>
      )
     })}
    </ul>
   </nav>
  </>
 )
}
