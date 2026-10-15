"use client"

import type { RefObject } from "react"

interface ApplicationIframeProps {
  src: string
  title: string
  iframeKey: number
  isPdf?: boolean
  /** Shell attaches this to verify postMessage events come from this frame. */
  iframeRef?: RefObject<HTMLIFrameElement | null>
  onLoad: () => void
  onError: () => void
}

/**
 * Borderless iframe filling all remaining shell space.
 * Keyed remount is the reload mechanism (shell owns the key).
 * PDFs render via the browser's native viewer; iOS gets an
 * <object> fallback with the same src since Safari iframes PDFs poorly.
 */
export function ApplicationIframe({ src, title, iframeKey, isPdf, iframeRef, onLoad, onError }: ApplicationIframeProps) {
  if (isPdf) {
    return (
      <object
        key={`apply-pdf-${iframeKey}`}
        data={src}
        type="application/pdf"
        aria-label={title}
        className="block h-full w-full border-0 bg-white"
      >
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          onLoad={onLoad}
          onError={onError}
          className="block h-full w-full border-0 bg-white"
          allow="fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      </object>
    )
  }
  return (
    <iframe
      key={`apply-live-${iframeKey}`}
      ref={iframeRef}
      src={src}
      title={title}
      onLoad={onLoad}
      onError={onError}
      className="block h-full w-full border-0 bg-white"
      allow="fullscreen"
      allowFullScreen
      referrerPolicy="no-referrer"
      sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
    />
  )
}
