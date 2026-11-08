"use client"

import { useState, useEffect } from "react"

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const el = document.documentElement
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? (el.scrollTop / total) * 100 : 0)
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  return (
    <div className="fixed left-0 top-0 z-[60] h-[3px] w-full bg-transparent print:hidden" aria-hidden>
      <div
        className="h-full bg-brick transition-[width] duration-150"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}