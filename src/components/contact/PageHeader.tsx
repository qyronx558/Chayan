"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronRight, Search } from "lucide-react"
import { FAQ_ITEMS, POPULAR_SEARCHES } from "@/lib/channels"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"

export function PageHeader({ onSelectFaq }: { onSelectFaq: (index: number) => void }) {
 const [query, setQuery] = useState("")
 const [focused, setFocused] = useState(false)
 const boxRef = useRef<HTMLDivElement>(null)

 const trimmed = query.trim().toLowerCase()
 const matches = trimmed
  ? FAQ_ITEMS.map((item, index) => ({ item, index })).filter(({ item }) =>
    trimmed.split(/\s+/).filter((word) => !["a", "my", "with", "us"].includes(word))
     .every((word) => `${item.question} ${item.answer}`.toLowerCase().includes(word))
   ).slice(0, 6)
  : []
 const open = focused && trimmed.length > 0

 useEffect(() => {
  function onPointerDown(event: PointerEvent) {
   if (boxRef.current && !boxRef.current.contains(event.target as Node)) setFocused(false)
  }
  document.addEventListener("pointerdown", onPointerDown)
  return () => document.removeEventListener("pointerdown", onPointerDown)
 }, [])

 return (
  <div ref={boxRef} className="relative pb-12 pt-10 md:pt-14">
   <nav aria-label="Breadcrumb">
    <ol className="flex items-center gap-1.5 text-[14px] text-[var(--cp-muted)]">
     <li>
      <Link href="/" className="transition-colors hover:text-[var(--cp-ink)]">
       Home
      </Link>
     </li>
     <li aria-hidden>
      <ChevronRight className="h-3.5 w-3.5 text-[var(--cp-faint)]" />
     </li>
     <li aria-current="page" className="text-[var(--cp-ink)]">
      Help
     </li>
    </ol>
   </nav>

   <div className="grid items-end gap-10 md:grid-cols-[minmax(0,1fr)_200px]">
    <div className="min-w-0">
     <p className={cn(typeFont.className, "mt-6 text-[11px] font-bold tracking-[0.3em] text-[var(--color-brick)]")}>POST OFFICE · डाकघर</p>
     <h1 className="mt-2 font-display text-[44px] font-black leading-[1.04] text-[var(--cp-ink)] sm:text-[54px]">
      Contact us
     </h1>
     <p className={cn(handFont.className, "mt-2 text-[1.35rem] leading-snug text-[var(--cp-ink)]/80")}>write to us like you&apos;d write to a friend. we&apos;ll find the right desk.</p>
     <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[var(--cp-muted)]">
      Tell us what you need help with and we will route it to the right team. Most messages get a reply within one business day.
     </p>

     {/* the enquiry window: ask before you write */}
     <div className="relative mt-7 max-w-[580px]">
      <label htmlFor="contact-search" className="sr-only">
       Search help articles
      </label>
      <div className="flex h-12 items-center gap-2 rounded-full border-[1.5px] border-[var(--cp-border)] bg-[var(--cp-field)] pl-1.5 pr-4 shadow-[0_8px_18px_-14px_rgb(0_0_0/.45)] transition focus-within:border-[var(--cp-ink)]/60">
       <span className={cn(typeFont.className, "shrink-0 rounded-full bg-[var(--cp-ink)] px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-[var(--cp-bg)]")} aria-hidden>ENQUIRY</span>
       <Search className="ml-1 h-4 w-4 shrink-0 text-[var(--cp-faint)]" aria-hidden />
       <input
        id="contact-search"
        type="search"
        aria-controls="contact-search-results"
        autoComplete="off"
        placeholder="Search help articles"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(event) => {
         if (event.key === "Escape") setFocused(false)
        }}
        className="w-full bg-transparent text-[15px] text-[var(--cp-ink)] placeholder:text-[var(--cp-faint)] focus:outline-none"
       />
      </div>
      {open && (
       <div
        id="contact-search-results"
        aria-label="Matching questions"
        className="absolute inset-x-0 z-30 mt-2 overflow-hidden rounded-[14px] border border-[var(--cp-border)] bg-[var(--hs-paper-slip)] py-1 shadow-[0_18px_30px_-18px_rgb(0_0_0/.5)]"
       >
        {matches.length === 0 ? (
         <p className={cn(handFont.className, "px-4 py-3 text-[1.05rem] text-[var(--cp-muted)]")}>
          No matching questions. Try the form below instead.
         </p>
        ) : (
         matches.map(({ item, index }) => (
          <button
           key={index}
           type="button"
           onClick={() => {
            onSelectFaq(index)
            setFocused(false)
           }}
           className="flex w-full items-baseline gap-2 px-4 py-2.5 text-left text-[14px] text-[var(--cp-ink)] transition-colors hover:bg-[var(--cp-soft)]"
          >
           <span className={cn(handFont.className, "text-[1.05rem] text-[var(--color-brick)]")}>Q.</span>
           {item.question}
          </button>
         ))
        )}
       </div>
      )}
     </div>
     <div className="mt-4 flex flex-wrap items-center gap-2 text-[13.5px]">
      <span className={cn(handFont.className, "text-[1.05rem] text-[var(--cp-muted)]")}>people often ask about:</span>
      {POPULAR_SEARCHES.map((term, i) => (
       <button
        key={term}
        type="button"
        onClick={() => {
         setQuery(term)
         setFocused(true)
        }}
        className={cn(
         "rounded-[4px] border border-dashed border-[var(--cp-border)] bg-[var(--hs-paper-slip)] px-2.5 py-1 text-[var(--cp-ink)] shadow-[0_3px_6px_-4px_rgb(0_0_0/.4)] transition hover:-translate-y-0.5 hover:border-solid hover:border-[var(--color-brick)]",
         i % 2 ? "rotate-[1deg]" : "-rotate-[1deg]",
        )}
       >
        {term}
       </button>
      ))}
     </div>
    </div>

    <PostBox />
   </div>
  </div>
 )
}

/** The red pillar letterbox you find outside every Indian post office. */
function PostBox() {
 return (
  <svg viewBox="0 0 160 250" className="mx-auto hidden h-[250px] w-[160px] md:block" aria-hidden>
   <ellipse cx="80" cy="242" rx="60" ry="7" fill="rgb(0 0 0 / .14)" />
   <rect x="38" y="200" width="84" height="40" rx="4" fill="oklch(34% 0.1 28)" />
   <rect x="30" y="60" width="100" height="150" rx="8" fill="oklch(52% 0.19 28)" />
   <path d="M30 62 a50 40 0 0 1 100 0 Z" fill="oklch(48% 0.18 28)" />
   <rect x="24" y="56" width="112" height="10" rx="5" fill="oklch(40% 0.15 28)" />
   <ellipse cx="80" cy="24" rx="12" ry="6" fill="oklch(40% 0.15 28)" />
   <rect x="46" y="86" width="68" height="9" rx="4.5" fill="oklch(18% 0.03 28)" />
   <rect x="46" y="104" width="68" height="34" rx="3" fill="oklch(96% 0.02 85)" />
   <text x="80" y="118" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="oklch(30% 0.08 28)" fontFamily="'Courier Prime', monospace">LETTER BOX</text>
   <text x="80" y="131" textAnchor="middle" fontSize="10" fill="oklch(30% 0.08 28)">पत्र पेटी</text>
   <rect x="58" y="150" width="44" height="30" rx="3" fill="none" stroke="oklch(40% 0.15 28)" strokeWidth="2" />
   <text x="80" y="162" textAnchor="middle" fontSize="7" fill="oklch(95% 0.02 85)" fontFamily="'Courier Prime', monospace">NEXT</text>
   <text x="80" y="173" textAnchor="middle" fontSize="7" fill="oklch(95% 0.02 85)" fontFamily="'Courier Prime', monospace">CLEARANCE</text>
   <rect x="40" y="66" width="7" height="130" rx="3.5" fill="oklch(62% 0.17 30 / .55)" />
   {/* a letter halfway into the slot */}
   <g transform="rotate(-8 80 80)">
    <rect x="56" y="62" width="48" height="30" rx="2" fill="oklch(90% 0.05 230)" stroke="oklch(60% 0.06 240)" strokeWidth="1" />
    <path d="M56 62 L 80 80 L 104 62" fill="none" stroke="oklch(60% 0.06 240)" strokeWidth="1" />
   </g>
  </svg>
 )
}
