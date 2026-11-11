import { getAppEnv, type AppEnv } from "@/lib/app-env"

/**
 * Feature flags: where each unfinished feature is switched on.
 *
 * Code merged to main is deployed to dev straight away, and goes to production
 * with the next release. A feature that is not ready for real users stays
 * listed here with only ["local", "dev"]. To launch it, add "production" (or
 * delete the flag and its checks) and cut a release.
 *
 * Usage:
 *   if (isFeatureEnabled("exampleFeature")) { ...new behaviour... }
 *   <FeatureGate name="exampleFeature">...</FeatureGate>
 */
export const FEATURES = {
  // Example entry - keep as a template, remove when you add the first real flag.
  exampleFeature: ["local", "dev"],
} as const satisfies Record<string, readonly AppEnv[]>

export type FeatureName = keyof typeof FEATURES

export function isFeatureEnabled(name: FeatureName, env: AppEnv = getAppEnv()): boolean {
  return (FEATURES[name] as readonly AppEnv[]).includes(env)
}

/** All features switched on in an environment (handy for an admin/debug page). */
export function enabledFeatures(env: AppEnv = getAppEnv()): FeatureName[] {
  return (Object.keys(FEATURES) as FeatureName[]).filter((name) => isFeatureEnabled(name, env))
}
