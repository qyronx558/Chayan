"use client"

import { useState } from "react"
import { Bookmark, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function SaveButton({ slug, title }: { slug: string; title: string }) {
  const key = `chayan-saved-blog-${slug}`
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
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
        saved
          ? "border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
          : "border-gray-200 bg-white text-gray-600 hover:border-[#B08D57] hover:text-[#1B3A5C] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
      )}
    >
      {saved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
      {saved ? "Saved" : "Save"}
    </button>
  )
}
