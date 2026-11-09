"use client"

import { useEffect, useState } from "react"

export interface FilterOption {
  id: string
  name: string
}

interface FilterOptions {
  categories: FilterOption[]
  departments: FilterOption[]
  states: FilterOption[]
}

const EMPTY: FilterOptions = { categories: [], departments: [], states: [] }

let cache: FilterOptions | null = null
let inflight: Promise<FilterOptions> | null = null

function loadFilterOptions(): Promise<FilterOptions> {
  if (cache) return Promise.resolve(cache)
  if (inflight) return inflight

  inflight = Promise.all([
    fetch("/api/categories").then((r) => r.json()),
    fetch("/api/departments").then((r) => r.json()),
    fetch("/api/states").then((r) => r.json()),
  ])
    .then(([catRes, depRes, stateRes]) => {
      cache = {
        categories: catRes?.success ? catRes.data : [],
        departments: depRes?.success ? depRes.data : [],
        states: stateRes?.success ? stateRes.data : [],
      }
      return cache
    })
    .catch(() => EMPTY)
    .finally(() => {
      inflight = null
    })

  return inflight
}

/**
 * Shared, session-cached facet options for listing pages.
 * Fetches once and reuses across client-side navigation.
 */
export function useFilterOptions({ includeStates = false }: { includeStates?: boolean } = {}): FilterOptions {
  const [options, setOptions] = useState<FilterOptions>(cache ?? EMPTY)

  useEffect(() => {
    if (cache) {
      setOptions(cache)
      return
    }
    let alive = true
    loadFilterOptions().then((data) => {
      if (alive) setOptions(data)
    })
    return () => {
      alive = false
    }
  }, [])

  return includeStates ? options : { ...options, states: [] }
}
