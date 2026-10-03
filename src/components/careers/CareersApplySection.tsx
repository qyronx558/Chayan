"use client"

import { useState } from "react"
import { getCareersEmbedUrl } from "@/lib/careers"

/**
 * Google Form embedded strictly inside chayanjobs.com.
 * - Same sandbox pattern as Apply Jobs (`ApplicationIframe`), but WITHOUT
 *   any `allow-top-navigation`, so links/buttons inside the form can never
 *   navigate the whole tab away from the site.
 * - Until a real form URL is configured, nothing from Google is loaded.
 */
export function CareersApplySection() {
  const [formLoaded, setFormLoaded] = useState(false)
  const embedUrl = getCareersEmbedUrl()
  const showDevHint =
    !embedUrl && process.env.NODE_ENV === "development"

  if (!embedUrl) {
    return (
      <div className="flex h-64 flex-col items-center justify-center border border-dashed border-gray-300 text-center dark:border-gray-700">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
          Application form coming soon
        </p>
        {showDevHint && (
          <p className="mt-2 px-6 font-mono text-[11px] text-gray-400 dark:text-gray-500">
            Add NEXT_PUBLIC_CAREERS_FORM_EMBED_URL in .env, then restart dev server.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-white">
      {!formLoaded && (
        <div className="flex h-48 items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-gray-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" aria-hidden="true" />
          Loading
        </div>
      )}
      <iframe
        src={embedUrl}
        title="ChayanJobs application form"
        className="block h-[1100px] w-full border-0 bg-white"
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
        onLoad={() => setFormLoaded(true)}
      />
    </div>
  )
}
