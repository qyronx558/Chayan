"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"
import { paperShadow, tilt } from "@/components/desk/DeskKit"
import type { ProfileCounts } from "@/lib/profile"

interface Card {
  href: string
  label: string
  count: number | null
  band: string
  empty: string
  some: (n: number) => string
}

export function TrackerShelf({ counts }: { counts: ProfileCounts }) {
  const cards: Card[] = [
    {
      href: "/applications",
      label: "GOVERNMENT FORMS",
      count: counts.applications,
      band: "var(--hs-gov)",
      empty: "Nothing filed yet. Track one from any job page.",
      some: (n) => (n === 1 ? "One form you're keeping an eye on." : `${n} forms, each with its own deadline.`),
    },
    {
      href: "/private-applications",
      label: "COMPANY APPLICATIONS",
      count: counts.privateApplications,
      band: "var(--hs-pvt)",
      empty: "No applications yet. Your first one goes here.",
      some: (n) => (n === 1 ? "One application out in the world." : `${n} applications out in the world.`),
    },
    {
      href: "/bookmarks",
      label: "SAVED FOR LATER",
      count: counts.bookmarks,
      band: "var(--hs-marigold)",
      empty: "Bookmark anything you want to come back to.",
      some: (n) => (n === 1 ? "One thing waiting for a second look." : `${n} things waiting for a second look.`),
    },
    {
      href: "/notifications",
      label: "NOTICE BOARD",
      count: null,
      band: "var(--hs-trust)",
      empty: "",
      some: () => "",
    },
  ]

  return (
    <nav aria-label="Your trackers" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {cards.map((c, i) => (
        <Link
          key={c.href}
          href={c.href}
          prefetch={false}
          className={cn(
            "group relative flex min-h-[8.5rem] flex-col overflow-hidden rounded-[4px] bg-[var(--hs-paper-slip)] px-4 pb-3.5 pt-5 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hs-trust)]",
            tilt(i)
          )}
          style={{ boxShadow: paperShadow }}
        >
          <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: c.band }} />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-4 bottom-3 top-12 opacity-60"
            style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 21px, var(--hs-border) 21px 22px)" }}
          />
          <span className={cn(typeFont.className, "relative text-[10.5px] font-bold tracking-[0.14em] text-muted-foreground")}>{c.label}</span>
          {c.count === null ? (
            <span className={cn(handFont.className, "relative mt-2 text-[17px] leading-snug text-foreground")}>
              Latest notices, results and what you asked us to watch.
            </span>
          ) : (
            <>
              <span className={cn(handFont.className, "relative mt-1 text-4xl leading-none text-foreground")}>{c.count.toLocaleString("en-IN")}</span>
              <span className={cn(handFont.className, "relative mt-auto pt-2 text-[14.5px] leading-snug text-muted-foreground")}>
                {c.count ? c.some(c.count) : c.empty}
              </span>
            </>
          )}
        </Link>
      ))}
    </nav>
  )
}
