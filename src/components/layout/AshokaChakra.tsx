"use client"

import * as React from "react"

export function AshokaChakra({ className }: { className?: string }) {
 const spokes = React.useMemo(() => Array.from({ length: 24 }), [])
 return (
  <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
   <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="5" />
   <circle cx="50" cy="50" r="7.5" fill="currentColor" />
   {spokes.map((_, i) => {
    const angle = (i * 15 * Math.PI) / 180
    const x2 = 50 + 41 * Math.cos(angle)
    const y2 = 50 + 41 * Math.sin(angle)
    return (
     <line
      key={i}
      x1="50"
      y1="50"
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
     />
    )
   })}
  </svg>
 )
}
