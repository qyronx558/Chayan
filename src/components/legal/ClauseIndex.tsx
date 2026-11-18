"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { handFont, typeFont } from "@/components/home/fonts"

/**
 * A bookmark ribbon down the side of the document: lists the clauses on the
 * page (read from the page itself, so it can never drift from the text) and
 * marks the one you are reading.
 */
export function ClauseIndex() {
  const [clauses, setClauses] = useState<{ id: string; title: string }[]>([])
  const [active, setActive] = useState<string>("")

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".legal-doc [data-clause]"))
    const t = setTimeout(() => setClauses(els.map((el) => ({ id: el.id, title: el.dataset.clause ?? "" }))), 0)
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (seen[0]) setActive(seen[0].target.id)
      },
      { rootMargin: "-20% 0px -65% 0px" },
    )
    els.forEach((el) => io.observe(el))
    return () => {
      clearTimeout(t)
      io.disconnect()
    }
  }, [])

  if (clauses.length === 0) return null

  return (
    <nav aria-label="Clauses on this page" className="rounded-[4px] border border-[var(--hs-border)] bg-[var(--hs-paper-slip)] px-4 py-4">
      <p className={cn(typeFont.className, "text-[10.5px] font-bold tracking-[0.25em] text-muted-foreground")}>CLAUSES</p>
      <ol className="mt-3 space-y-0.5">
        {clauses.map((c, i) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              aria-current={active === c.id ? "location" : undefined}
              className={cn(
                "flex gap-2.5 rounded-[3px] border-l-2 py-1.5 pl-2.5 pr-1 text-[13.5px] leading-snug transition-colors",
                active === c.id
                  ? "border-[var(--color-brick)] bg-[color-mix(in_oklch,var(--color-brick)_7%,transparent)] font-semibold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <span className={cn(typeFont.className, "shrink-0 text-[11.5px] text-[var(--color-brick)]")}>§{i + 1}</span>
              {c.title}
            </a>
          </li>
        ))}
      </ol>
      <p className={cn(handFont.className, "mt-3 border-t border-dashed border-[var(--hs-border-strong)] pt-2.5 text-[0.98rem] text-muted-foreground")}>
        jump to any clause ↑
      </p>
    </nav>
  )
}
