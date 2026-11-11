"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { DocTocItem } from "./types"

/** "On this page" list that highlights the section currently being read. */
export function DocsToc({ items }: { items: DocTocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "")

  useEffect(() => {
    const headings = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => el !== null)
    if (headings.length === 0) return

    const onScroll = () => {
      // The active section is the last heading that has scrolled past the top band.
      const line = 140
      let current = headings[0].id
      for (const h of headings) {
        if (h.getBoundingClientRect().top - line <= 0) current = h.id
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      if (atBottom) current = headings[headings.length - 1].id
      setActive(current)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [items])

  if (items.length === 0) return null

  return (
    <nav aria-label="On this page" className="docs-chrome">
      <p className="agate mb-2 text-[0.75rem] text-muted-foreground">On this page</p>
      <ul className="border-l border-rule">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "location" : undefined}
              style={{ borderLeftColor: active === item.id ? "var(--color-brick)" : "transparent" }}
              className={cn(
                "-ml-px block border-l-2 py-1 pl-3 text-[0.86rem] leading-snug no-underline transition-colors",
                active === item.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
