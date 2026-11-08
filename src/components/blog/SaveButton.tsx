"use client"

import { useState } from "react"
import { Bookmark, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function SaveButton({ slug, title }: { slug: string; title: string }) {
  const key = `ChayanJobs-saved-blog-${slug}`
  const [saved, setSaved] = useState(() => {
    try { return localStorage.getItem(key) === "1" } catch { return false }
  })

  const toggle = () => {
    const next = !saved
    setSaved(next)
    try {
      if (next) localStorage.setItem(key, JSON.stringify({ title, at: Date.now() }))
      else localStorage.removeItem(key)
    } catch { /* ignore */ }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? "Saved to reading list" : "Save to reading list"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
        saved
          ? "border-rule bg-paper-3 text-foreground dark:border-rule dark:bg-paper-3 dark:text-foreground"
          : "border-rule bg-background text-muted-foreground hover:border-brick hover:text-brick dark:border-ink dark:bg-ink dark:text-muted-foreground"
      )}
    >
      {saved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
      {saved ? "Saved" : "Save"}
    </button>
  )
}
