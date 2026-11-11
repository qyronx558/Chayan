import type { ReactNode } from "react"
import { isFeatureEnabled, type FeatureName } from "@/lib/features"

/** Renders children only where the feature is switched on (see src/lib/features.ts). */
export function FeatureGate({ name, children, fallback = null }: { name: FeatureName; children: ReactNode; fallback?: ReactNode }) {
  return <>{isFeatureEnabled(name) ? children : fallback}</>
}
