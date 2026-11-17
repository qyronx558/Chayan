"use client"

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react"

/**
 * Marks its subtree with data-seen="false" until it scrolls into view, so the
 * hand-made animations in home.css start when the reader actually arrives.
 */
export function InView({ children, ...rest }: ComponentPropsWithoutRef<"div">) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} data-seen={seen} {...rest}>
      {children}
    </div>
  )
}
