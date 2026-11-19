"use client"

import { useLayoutEffect } from "react"
import { declareEntity, type TrackedEntityType } from "./page-view-store"

export type { TrackedEntityType }

export function EntityViewTracker({ entityType, entityId }: { entityType: TrackedEntityType; entityId: string }) {
  useLayoutEffect(() => {
    declareEntity({ path: window.location.pathname, entityType, entityId })
  }, [entityType, entityId])
  return null
}
