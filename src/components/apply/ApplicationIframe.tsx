"use client"

interface ApplicationIframeProps {
  src: string
  title: string
  iframeKey: number
  onLoad: () => void
  onError: () => void
}

/**
 * Borderless iframe filling all remaining shell space.
 * Keyed remount is the reload mechanism (shell owns the key).
 */
export function ApplicationIframe({ src, title, iframeKey, onLoad, onError }: ApplicationIframeProps) {
  return (
    <iframe
      key={`apply-live-${iframeKey}`}
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
