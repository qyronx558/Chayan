"use client"

import { useEffect, useState } from "react"

export interface DistrictOption {
  id: string
  name: string
  slug: string
}

const cache = new Map<string, DistrictOption[]>()

/** Districts of one state (by slug), session-cached. Empty list until a state is chosen. */
export function useDistricts(stateSlug: string | null | undefined): { districts: DistrictOption[]; loading: boolean } {
  const key = stateSlug?.trim() || ""
  // Bumped when a fetch lands so the component re-reads the module cache.
  const [, setVersion] = useState(0)

  useEffect(() => {
    if (!key || cache.has(key)) return
    let alive = true
    fetch(`/api/states/${encodeURIComponent(key)}/districts`)
      .then((r) => r.json())
      .then((res) => {
        cache.set(key, res?.success ? (res.data as DistrictOption[]) : [])
      })
      .catch(() => {
        cache.set(key, [])
      })
      .finally(() => {
        if (alive) setVersion((v) => v + 1)
      })
    return () => {
      alive = false
    }
  }, [key])

  if (!key) return { districts: [], loading: false }
  const hit = cache.get(key)
  return hit ? { districts: hit, loading: false } : { districts: [], loading: true }
}
