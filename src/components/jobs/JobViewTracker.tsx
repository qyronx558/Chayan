"use client"

import { useEffect, useRef } from "react"

export function JobViewTracker({ jobId }: { jobId: string }) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    fetch(`/api/jobs/${jobId}/view`, { method: "POST" }).catch(() => {})
  }, [jobId])

  return null
}