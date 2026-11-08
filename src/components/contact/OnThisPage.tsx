"use client"

import { useEffect, useState } from "react"
import { isSupportOnline } from "@/lib/channels"

const SECTIONS = [
 { id: "message", label: "Send us a message" },
 { id: "directory", label: "Email directory" },
 { id: "hours", label: "Hours and office" },
 { id: "faq", label: "Frequently asked" },
]

export function OnThisPage() {
 const [active, setActive] = useState("message")
 const [online, setOnline] = useState<boolean | null>(null)

 useEffect(() => {
  // Defer time-sensitive text until hydration completes.
  const initial = setTimeout(() => setOnline(isSupportOnline()), 0)
  const timer = setInterval(() => setOnline(isSupportOnline()), 60000)
  return () => { clearTimeout(initial); clearInterval(timer) }
 }, [])

 useEffect(() => {
  const observer = new IntersectionObserver(
   (entries) => {
    for (const entry of entries) {
     if (entry.isIntersecting) setActive(entry.target.id)
    }
   },
   { rootMargin: "-30% 0px -60% 0px" }
  )
  for (const section of SECTIONS) {
   const node = document.getElementById(section.id)
   if (node) observer.observe(node)
  }
  return () => observer.disconnect()
 }, [])

 return (
  <div className="lg:sticky lg:top-24 lg:self-start">
   <p className="text-[13px] font-semibold text-[var(--cp-ink)]">On this page</p>
   <nav aria-label="On this page" className="mt-2 border-l border-[var(--cp-border)]">
    <ul>
     {SECTIONS.map((section) => {
      const isActive = active === section.id
      return (
       <li key={section.id}>
        <a
         href={`#${section.id}`}
         aria-current={isActive ? "true" : undefined}
         className={`-ml-px block border-l-2 py-1.5 pl-4 text-[14px] transition-colors ${
          isActive
           ? "border-[var(--cp-ink)] font-medium text-[var(--cp-ink)]"
           : "border-transparent text-[var(--cp-muted)] hover:text-[var(--cp-ink)]"
         }`}
        >
         {section.label}
        </a>
       </li>
      )
     })}
    </ul>
   </nav>
   <p className="mt-6 flex items-center gap-2 text-[13px] text-[var(--cp-muted)]">
    <span
     aria-hidden
     className="cp-status-dot"
     style={{ background: online ? "var(--color-brick)" : "var(--cp-faint)" }}
    />
    {online === null ? "Checking support hours" : online ? "Within support hours" : "Outside support hours"}
   </p>
  </div>
 )
}
