"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { OFFICE_ADDRESS, OFFICE_MAPS_URL, SUPPORT_HOURS, isSupportOnline } from "@/lib/channels"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"

/**
 * A shop-door sign that flips OPEN / CLOSED with the real support hours,
 * and the brass plate by the door with the address.
 */
export function HoursOffice() {
 const [online, setOnline] = useState<boolean | null>(null)
 useEffect(() => {
  // same timing rule as the "On this page" status: decided after hydration
  const first = setTimeout(() => setOnline(isSupportOnline()), 0)
  const timer = setInterval(() => setOnline(isSupportOnline()), 60000)
  return () => { clearTimeout(first); clearInterval(timer) }
 }, [])

 const signInk = online ? "oklch(42% 0.11 160)" : "oklch(46% 0.16 28)"
 return (
  <dl className="grid items-start gap-10 sm:grid-cols-2">
   <div className="flex flex-col items-center sm:items-start">
    <dt className="sr-only">Support hours</dt>
    {/* string and nail */}
    <svg viewBox="0 0 230 46" className="h-[46px] w-[230px]" aria-hidden>
     <circle cx="115" cy="6" r="4.5" fill="oklch(55% 0.02 70)" />
     <path d="M115 8 L 30 44 M115 8 L 200 44" stroke="oklch(55% 0.04 60)" strokeWidth="1.6" fill="none" />
    </svg>
    <dd className="hs-sway -mt-1 w-[230px] origin-top rounded-[8px] border-[3px] px-5 pb-4 pt-3 text-center" style={{ background: "oklch(97% 0.012 85)", borderColor: signInk, color: "oklch(27% 0.03 60)", boxShadow: "0 16px 24px -16px rgb(40 20 0 / .55)" }}>
     <p className="font-display text-[2rem] font-black leading-none tracking-[0.06em]" style={{ color: signInk }}>
      {online === null ? "· · ·" : online ? "OPEN" : "CLOSED"}
     </p>
     <p className={cn(handFont.className, "mt-1 text-[1.05rem] leading-snug")}>
      {online === null ? "checking the clock…" : online ? "we're at the desk right now" : "leave a letter anyway, we'll pick it up"}
     </p>
     <p className={cn(typeFont.className, "mt-3 border-t border-dashed border-[oklch(27%_0.03_60/0.3)] pt-2 text-[11.5px] leading-relaxed")}>{SUPPORT_HOURS}</p>
    </dd>
   </div>
   <div className="sm:pt-12">
    <dt className="sr-only">Office</dt>
    <dd className="rounded-[6px] p-[5px]" style={{ background: "linear-gradient(135deg, oklch(80% 0.1 85), oklch(66% 0.1 75))", boxShadow: "0 14px 22px -16px rgb(40 20 0 / .6)" }}>
     <div className="rounded-[3px] border border-[oklch(55%_0.08_70)] px-5 py-4 text-[oklch(25%_0.04_60)]" style={{ background: "linear-gradient(180deg, oklch(88% 0.08 88), oklch(78% 0.09 80))" }}>
      <p className={cn(typeFont.className, "text-[10px] font-bold tracking-[0.3em]")}>OFFICE</p>
      <p className="mt-1.5 text-[15px] font-semibold leading-relaxed">{OFFICE_ADDRESS}</p>
     </div>
    </dd>
    <Link
     href={OFFICE_MAPS_URL}
     target="_blank"
     rel="noreferrer"
     className={cn(handFont.className, "mt-3 inline-block text-[1.12rem] text-[var(--cp-link)] underline decoration-wavy decoration-1 underline-offset-4")}
    >
     Get directions →
    </Link>
   </div>
  </dl>
 )
}
