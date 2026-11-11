import { ENV_LABELS, getAppEnv, type AppEnv } from "@/lib/app-env"

const STYLES: Record<Exclude<AppEnv, "production">, string> = {
  local: "bg-sky-600 text-white",
  dev: "bg-amber-400 text-black",
}

/**
 * A strip at the very top of every page on local and dev, so nobody mistakes
 * a test copy for the live site. Renders nothing on production.
 */
export function EnvironmentBanner({ env = getAppEnv() }: { env?: AppEnv }) {
  if (env === "production") return null
  const label = ENV_LABELS[env]
  return (
    <div
      role="status"
      data-app-env={env}
      className={`sticky top-0 z-[100] w-full px-3 py-1 text-center text-xs font-semibold tracking-wide ${STYLES[env]}`}
    >
      <span className="mr-2 rounded bg-black/15 px-1.5 py-0.5 font-bold">{label.name}</span>
      {label.note}
    </div>
  )
}
