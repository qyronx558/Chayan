/* eslint-disable @next/next/no-img-element -- company logos come from arbitrary hosts */
"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { monogram } from "@/components/private/job-list-utils"

/** Company logo with a calm monogram fallback (also used when the image fails to load). */
export function CompanyLogo({ name, logo, size = 44, className }: { name: string; logo?: string | null; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false)
  const { letters, hue } = monogram(name)
  const box = { width: size, height: size }
  if (logo && !failed) {
    return (
      <img
        src={logo}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-xl border border-rule bg-white object-contain p-1", className)}
        style={box}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 select-none items-center justify-center rounded-xl text-sm font-semibold", className)}
      style={{ ...box, backgroundColor: `hsl(${hue} 35% 92%)`, color: `hsl(${hue} 40% 28%)` }}
    >
      {letters}
    </span>
  )
}
