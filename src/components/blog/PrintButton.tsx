"use client"

import { useCallback } from "react"
import { Printer } from "lucide-react"

export function PrintButton({ title }: { title?: string }) {
  const handlePrint = useCallback(() => {
    const prevTitle = document.title
    if (title) {
      const safe = title.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 120)
      if (safe) document.title = `${safe} - Chayan Blog`
    }
    const restore = () => {
      document.title = prevTitle
      window.removeEventListener("afterprint", restore)
    }
    window.addEventListener("afterprint", restore)
    // Fallback restore in case afterprint does not fire
    setTimeout(restore, 3000)
    window.print()
  }, [title])

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="hidden items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-[#B08D57] hover:text-[#1B3A5C] sm:inline-flex print:hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
    >
      <Printer className="h-3.5 w-3.5" /> Print / PDF
    </button>
  )
}
