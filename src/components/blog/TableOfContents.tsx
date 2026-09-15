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
    <nav className={cn("rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800", className)}>
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100"
      >
        <span className="flex items-center gap-2">
          <ListTree className="h-4 w-4 text-[#8A6D3B]" /> On this page
        </span>
        {collapsed ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronUp className="h-4 w-4 text-gray-400" />}
      </button>
      {!collapsed && (
        <ul className="space-y-1 border-t border-gray-100 px-3 py-3 dark:border-gray-700">
          {headings.map((h) => (
            <li key={h.id} style={{ paddingLeft: h.level === 3 ? "1rem" : "0" }}>
              <button
                type="button"
                onClick={() => scrollTo(h.id)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-[13px] leading-snug transition-colors",
                  active === h.id
                    ? "bg-[#F4EDDE] font-semibold text-[#1B3A5C] dark:bg-blue-950 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200"
                )}
              >
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", active === h.id ? "bg-[#B08D57]" : "bg-gray-300 dark:bg-gray-600")} />
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}