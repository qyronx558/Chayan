"use client"

import { useEffect, useState } from "react"

/** Track which anchored section is currently in view (for rail TOC highlight). */
export function useActiveSection(ids: string[]): string | null {
 const [active, setActive] = useState<string | null>(null)
 const key = ids.join("|")
 useEffect(() => {
  const list = key ? key.split("|") : []
  if (list.length === 0) return
  const observer = new IntersectionObserver(
   (entries) => {
    for (const e of entries) {
     if (e.isIntersecting) setActive(e.target.id)
    }
   },
   { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
  )
  for (const id of list) {
   const el = document.getElementById(id)
   if (el) observer.observe(el)
  }
  return () => observer.disconnect()
 }, [key])
 return active
}
