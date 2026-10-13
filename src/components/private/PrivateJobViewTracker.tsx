"use client"

import { useEffect, useRef } from "react"

/** Increments PrivateJob.views + daily PrivateJobView row (mirrors JobViewTracker). */
export function PrivateJobViewTracker({ jobId }: { jobId: string }) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    fetch(`/api/private-jobs/${jobId}/view`, { method: "POST" }).catch(() => {})
  }, [jobId])

  return null
}
