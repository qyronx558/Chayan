"use client"

import { useState, useEffect, useRef } from "react"
import { ListTree, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Heading {
  level: 2 | 3
  text: string
  id: string
}

export function TableOfContents({ className }: { className?: string }) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [active, setActive] = useState<string>("")
  const [collapsed, setCollapsed] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const article = document.querySelector("[data-article-body]")
    if (!article) return

    const items: Heading[] = []
    article.querySelectorAll("h2, h3").forEach((h) => {
      const text = h.textContent?.trim()
      if (!text || text.length > 100) return
      const id = h.id || text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80)
      if (!h.id) h.id = id
      items.push({ level: h.tagName === "H3" ? 3 : 2, text, id })
    })
    setHeadings(items)
    if (items.length < 2) return

    const els = Array.from(article.querySelectorAll("h2, h3"))

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive((entry.target as HTMLElement).id || entry.target.textContent?.trim() || "")
          }
        }
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    )
    els.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [])

  if (headings.length < 2) return null

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    try {
      history.replaceState(null, "", `#${id}`)
    } catch { /* ignore */ }
  }

  return (
    <nav className={cn("relative rounded-[3px] border border-[var(--hs-border-strong,var(--color-rule))] bg-[var(--hs-paper-slip,var(--background))]", className)}>
      <span className="absolute -top-1 right-5 h-10 w-4 bg-[var(--color-brick)]" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)" }} aria-hidden />
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 pr-12 text-sm font-semibold text-foreground"
      >
        <span className="flex items-center gap-2">
          <ListTree className="h-4 w-4 text-[var(--color-brick)]" /> On this page
        </span>
        {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
      </button>
      {!collapsed && (
        <ul className="space-y-0.5 border-t border-dashed border-[var(--hs-border-strong,var(--color-rule))] px-3 py-3">
          {headings.map((h) => (
            <li key={h.id} style={{ paddingLeft: h.level === 3 ? "1rem" : "0" }}>
              <button
                type="button"
                onClick={() => scrollTo(h.id)}
                className={cn(
                  "relative flex w-full items-start gap-2 px-2 py-1.5 text-left text-[13px] leading-snug transition-colors",
                  active === h.id ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn("mt-[3px] w-3 shrink-0 text-[var(--color-brick)]", active === h.id ? "opacity-100" : "opacity-0")} aria-hidden>→</span>
                <span className={cn(active === h.id && "underline decoration-[var(--color-brick)] decoration-wavy decoration-1 underline-offset-4")}>{h.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
