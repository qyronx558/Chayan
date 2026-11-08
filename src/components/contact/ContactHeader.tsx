"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { LogoSmall } from "@/components/layout/LogoSmall"

const NAV_LINKS = [
 { label: "Jobs", href: "/jobs" },
 { label: "Blog", href: "/blog" },
 { label: "Careers", href: "/careers" },
 { label: "About", href: "/about" },
]

export function ContactHeader() {
 const [open, setOpen] = useState(false)

 return (
  <header className="sticky top-0 z-40 border-b border-[var(--cp-border)] bg-[var(--cp-bg)]">
   <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6">
    <LogoSmall />
    <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
     {NAV_LINKS.map((link) => (
      <Link
       key={link.href}
       href={link.href}
       className="rounded-md px-3 py-2 text-[14px] font-medium text-[var(--cp-muted)] transition-colors hover:text-[var(--cp-ink)]"
      >
       {link.label}
      </Link>
     ))}
    </nav>
    <div className="hidden items-center gap-2 md:flex">
     <ThemeToggle />
     <Link
      href="/login"
      className="rounded-md px-3 py-2 text-[14px] font-medium text-[var(--cp-muted)] transition-colors hover:text-[var(--cp-ink)]"
     >
      Sign in
     </Link>
     <Link
      href="/register"
      className="rounded-md bg-[var(--cp-btn)] px-3.5 py-2 text-[14px] font-medium text-[var(--cp-btn-ink)] transition-opacity hover:opacity-85"
     >
      Get job alerts
     </Link>
    </div>
    <div className="flex items-center gap-1 md:hidden">
     <ThemeToggle />
     <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-expanded={open}
      aria-controls="contact-mobile-navigation"
      aria-label={open ? "Close menu" : "Open menu"}
      className="rounded-md p-2 text-[var(--cp-ink)]"
     >
      {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
     </button>
    </div>
   </div>
   {open && (
    <nav id="contact-mobile-navigation" aria-label="Mobile" className="border-t border-[var(--cp-border)] px-4 py-3 md:hidden">
     <div className="flex flex-col">
      {NAV_LINKS.map((link) => (
       <Link
        key={link.href}
        href={link.href}
        onClick={() => setOpen(false)}
        className="rounded-md py-2.5 text-[15px] font-medium text-[var(--cp-muted)] hover:text-[var(--cp-ink)]"
       >
        {link.label}
       </Link>
      ))}
      <div className="mt-2 flex items-center gap-3 border-t border-[var(--cp-border)] pt-3">
       <Link href="/login" onClick={() => setOpen(false)} className="text-[15px] font-medium text-[var(--cp-muted)]">
        Sign in
       </Link>
       <Link
        href="/register"
        onClick={() => setOpen(false)}
        className="rounded-md bg-[var(--cp-btn)] px-3.5 py-2 text-[14px] font-medium text-[var(--cp-btn-ink)]"
       >
        Get job alerts
       </Link>
      </div>
     </div>
    </nav>
   )}
  </header>
 )
}
