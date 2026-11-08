"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronRight, Search } from "lucide-react"
import { FAQ_ITEMS, POPULAR_SEARCHES } from "@/lib/channels"

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
  <div ref={boxRef} className="pb-10 pt-10 md:pt-14">
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
   <h1 className="mt-5 text-[46px] font-semibold leading-[1.1] tracking-[-0.035em] text-[var(--cp-ink)]">
    Contact us
   </h1>
   <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[var(--cp-muted)]">
    Tell us what you need help with and we will route it to the right team. Most messages get a reply within one business day.
   </p>
   <div className="relative mt-6 max-w-[560px]">
    <label htmlFor="contact-search" className="sr-only">
     Search help articles
    </label>
    <div className="flex h-10 items-center gap-2 rounded-md border border-[var(--cp-border)] bg-[var(--cp-field)] px-3">
     <Search className="h-4 w-4 shrink-0 text-[var(--cp-faint)]" aria-hidden />
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
      className="relative z-30 mt-1 rounded-md border border-[var(--cp-border)] bg-[var(--cp-bg)] py-1"
     >
      {matches.length === 0 ? (
       <p className="px-3 py-2.5 text-[14px] text-[var(--cp-muted)]">
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
         className="block w-full px-3 py-2.5 text-left text-[14px] text-[var(--cp-ink)] transition-colors hover:bg-[var(--cp-soft)]"
        >
         {item.question}
        </button>
       ))
      )}
     </div>
    )}
   </div>
   <div className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px]">
    <span className="text-[var(--cp-muted)]">Popular:</span>
    {POPULAR_SEARCHES.map((term, i) => (
     <span key={term} className="flex items-center gap-1.5">
      {i > 0 && <span aria-hidden className="text-[var(--cp-faint)]">·</span>}
      <button
       type="button"
       onClick={() => {
        setQuery(term)
        setFocused(true)
       }}
       className="text-[var(--cp-link)] underline decoration-[var(--cp-link)]/40 underline-offset-4 transition-colors hover:decoration-[var(--cp-link)]"
      >
       {term}
      </button>
     </span>
    ))}
   </div>
  </div>
 )
}
