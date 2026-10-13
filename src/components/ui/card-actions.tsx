"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { shareOrCopy } from "@/lib/share"
import { cn } from "@/lib/utils"

export function CardShareButton({
  title,
  url,
  text,
  className,
}: {
  title: string
  url: string
  text?: string
  className?: string
}) {
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      const res = await shareOrCopy({ title, url, text })
      if (res === "copied" || res === "shared") {
        setDone(true)
        setTimeout(() => setDone(false), 1600)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={busy}
      aria-label={`Share: ${title}`}
      title="Share"
      className={cn(
        "h-8 w-8 rounded-lg border-slate-200 bg-white text-slate-500 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
        className
      )}
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> : <Share2 className="h-3.5 w-3.5" aria-hidden />}
    </Button>
  )
}
