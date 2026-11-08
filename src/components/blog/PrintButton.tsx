"use client"

import { useCallback } from "react"
import { Printer } from "lucide-react"

export function PrintButton({ title }: { title?: string }) {
  const handlePrint = useCallback(() => {
    const prevTitle = document.title
    if (title) {
      const safe = title.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 120)
      if (safe) document.title = `${safe} - ChayanJobs Blog`
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
      className="hidden items-center gap-1.5 rounded-full border border-rule bg-background px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-brick hover:text-brick sm:inline-flex print:hidden dark:border-ink dark:bg-ink dark:text-muted-foreground"
    >
      <Printer className="h-3.5 w-3.5" /> Print / PDF
    </button>
  )
}
