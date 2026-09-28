"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApplicationFloatingCTAProps {
  officialUrl: string
  hostname: string
  /** e.g. "Official Website" | "Official Application" */
  sublabel: string
  onApply: () => void
  /** Desktop floating card vs mobile bottom bar. */
  variant: "desktop" | "mobile"
  /** Main CTA text. Defaults to "Apply Now". */
  title?: string
}

/**
 * Always-visible Apply CTA. Desktop: fixed floating card.
 * Mobile: full-width bottom bar (rendered by the shell with safe-area padding).
 * One-time subtle scale-in on mount; no blinking.
 */
export function ApplicationFloatingCTA({
  officialUrl,
  hostname,
  sublabel,
  onApply,
  variant,
  title = "Apply Now",
}: ApplicationFloatingCTAProps) {
  const [intro, setIntro] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), 550)
    return () => window.clearTimeout(t)
  }, [])

  if (variant === "mobile") {
    return (
      <div className="border-t border-gray-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onApply}
          aria-label={`${title} on ${hostname}`}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-base font-semibold text-white",
            "shadow-[0_8px_24px_rgba(5,150,105,0.4)] transition hover:bg-emerald-700 active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
            intro && "scale-[0.97]"
          )}
        >
          {title}
          <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        </a>
        <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
          <ShieldCheck className="h-3 w-3 text-emerald-600" aria-hidden="true" />
          {sublabel} · {hostname}
        </p>
      </div>
    )
  }

  return (
    <a
      href={officialUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onApply}
      aria-label={`${title} on ${hostname}`}
      className={cn(
        "fixed bottom-5 right-5 z-40 hidden w-[200px] flex-col justify-center gap-0.5 rounded-xl bg-emerald-600 px-4 py-3 text-white md:flex",
        "shadow-[0_10px_36px_rgba(5,150,105,0.45)] transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-[0_14px_40px_rgba(5,150,105,0.5)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
        intro ? "scale-95 opacity-90" : "scale-100 opacity-100"
      )}
    >
      <span className="flex items-center justify-between text-[15px] font-semibold leading-tight">
        {title}
        <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-[11px] font-normal leading-tight text-emerald-50">{sublabel}</span>
    </a>
  )
}
