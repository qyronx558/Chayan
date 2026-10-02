"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, Info, RefreshCw, X } from "lucide-react"
import { ApplicationTopBar } from "@/components/apply/ApplicationTopBar"
import { ApplicationToolRail } from "@/components/apply/ApplicationToolRail"
import { ApplicationIframe } from "@/components/apply/ApplicationIframe"
import { ApplicationFloatingCTA } from "@/components/apply/ApplicationFloatingCTA"
import { ApplicationInfoDrawer } from "@/components/apply/ApplicationInfoDrawer"
import { ApplicationFallback } from "@/components/apply/ApplicationFallback"
import { ApplicationMobileMenu } from "@/components/apply/ApplicationMobileMenu"
import type { ApplicationShellProps } from "@/components/apply/application-types"
import { isDocumentApplication } from "@/components/apply/application-types"
import { trackApplyEvent } from "@/lib/apply-analytics"

type FrameStatus = "checking" | "allowed" | "blocked" | "unknown"

const RAIL_STORAGE_KEY = "cj-apply-rail-collapsed"
const LOAD_TIMEOUT_MS = 12000

/**
 * Unified "Application Mode" shell for government + private apply routes.
 * Maximum space for the official site; minimal ChayanJobsJobs chrome;
 * Apply CTA always visible; blocked embeds get a premium fallback.
 */
export function ApplicationShell(props: ApplicationShellProps) {
  const {
    type,
    jobId,
    slug,
    title,
    organization,
    officialUrl,
    hostname,
    deadlineLabel,
    updatedLabel,
    sourceLabel,
    backHref,
    backLabel,
    infoRows,
  } = props

  const router = useRouter()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      return window.sessionStorage.getItem(RAIL_STORAGE_KEY) === "1"
    } catch {
      return false
    }
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [frameStatus, setFrameStatus] = useState<FrameStatus>("checking")
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [slowLoad, setSlowLoad] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [noticeVisible, setNoticeVisible] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      return !window.sessionStorage.getItem(`cj-apply-notice-${slug}`)
    } catch {
      return true
    }
  })

  const analyticsBase = { job_id: jobId, job_slug: slug, job_type: type, destination_domain: hostname }
  const openedTracked = useRef(false)
  const loadedTracked = useRef(false)
  const failedTracked = useRef(false)

  const dismissNotice = useCallback(() => {
    setNoticeVisible(false)
    try {
      window.sessionStorage.setItem(`cj-apply-notice-${slug}`, "1")
    } catch {
      // Ignore storage failures.
    }
  }, [slug])

  // application_page_opened (once).
  useEffect(() => {
    if (openedTracked.current) return
    openedTracked.current = true
    trackApplyEvent("application_page_opened", analyticsBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount
  }, [])

  const runFrameCheck = useCallback(async () => {
    setFrameStatus("checking")
    try {
      const res = await fetch(`/api/apply/check?url=${encodeURIComponent(officialUrl)}`)
      const json = await res.json()
      if (json?.frameable === false) {
        setFrameStatus("blocked")
        if (!failedTracked.current) {
          failedTracked.current = true
          trackApplyEvent("iframe_failed", analyticsBase)
        }
      } else if (json?.frameable === true) {
        setFrameStatus("allowed")
      } else {
        setFrameStatus("unknown")
      }
    } catch {
      setFrameStatus("unknown")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per mount
  }, [officialUrl])

  useEffect(() => {
    runFrameCheck()
  }, [runFrameCheck])

  // Slow-load hint if the iframe takes too long.
  useEffect(() => {
    if (iframeLoaded) return
    const t = window.setTimeout(() => setSlowLoad(true), LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(t)
  }, [iframeKey, officialUrl, iframeLoaded])

  const reload = useCallback(() => {
    setIframeLoaded(false)
    setLoadError(false)
    setSlowLoad(false)
    setIframeKey((k) => k + 1)
    runFrameCheck()
  }, [runFrameCheck])

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true)
    setSlowLoad(false)
    if (!loadedTracked.current) {
      loadedTracked.current = true
      trackApplyEvent("iframe_loaded", analyticsBase)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per mount
  }, [])

  const handleIframeError = useCallback(() => {
    setLoadError(true)
    if (!failedTracked.current) {
      failedTracked.current = true
      trackApplyEvent("iframe_failed", analyticsBase)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per mount
  }, [])

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        window.sessionStorage.setItem(RAIL_STORAGE_KEY, next ? "1" : "0")
      } catch {
        // Ignore storage failures.
      }
      if (next) trackApplyEvent("sidebar_collapsed", analyticsBase)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per mount
  }, [])

  const openInfo = useCallback(() => {
    setDrawerOpen(true)
    trackApplyEvent("job_info_opened", analyticsBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per mount
  }, [])

  const reportIssue = useCallback(() => {
    trackApplyEvent("report_issue_clicked", analyticsBase)
    router.push("/contact")
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per mount
  }, [router])

  const handleApply = useCallback(() => {
    trackApplyEvent("apply_cta_clicked", analyticsBase)
    trackApplyEvent("official_site_opened", analyticsBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per mount
  }, [])

  const share = useCallback(async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `${title} - ${organization}`, url })
        return
      }
      await navigator.clipboard.writeText(url)
    } catch {
      // User cancelled or clipboard unavailable - stay silent.
    }
  }, [title, organization])

  const blocked = frameStatus === "blocked" || loadError
  const isDocument = isDocumentApplication(type)
  const ctaSublabel = isDocument
    ? "Official Document"
    : type === "government"
      ? "Official Website"
      : "Official Application"
  const noticeText = isDocument
    ? "You are opening the official document in fullscreen."
    : type === "government"
      ? "You are opening the official application website."
      : "You'll complete your application on the company's official careers website."

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      {/* Desktop left tool rail */}
      <div className="hidden shrink-0 md:flex">
        <ApplicationToolRail
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          backHref={backHref}
          backLabel={backLabel}
          onInfo={openInfo}
          onReload={reload}
          officialUrl={officialUrl}
          hostname={hostname}
          onReport={reportIssue}
        />
      </div>

      {/* Main column: top bar + official website */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ApplicationTopBar
          type={type}
          title={title}
          organization={organization}
          hostname={hostname}
          deadlineLabel={deadlineLabel}
          sourceLabel={sourceLabel}
          backHref={backHref}
          backLabel={backLabel}
          mobileMenu={
            <ApplicationMobileMenu
              hostname={hostname}
              officialUrl={officialUrl}
              onInfo={openInfo}
              onReload={reload}
              onShare={share}
              onReport={reportIssue}
            />
          }
        />

        <div className="relative min-h-0 flex-1 bg-white dark:bg-white">
          {blocked ? (
            <ApplicationFallback
              organization={organization}
              hostname={hostname}
              officialUrl={officialUrl}
              sourceLabel={sourceLabel}
              headline={isDocument ? "Official document" : undefined}
              onReload={reload}
              onReport={reportIssue}
              onOpenOfficial={handleApply}
            />
          ) : (
            <>
              <ApplicationIframe
                src={officialUrl}
                title={title}
                iframeKey={iframeKey}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />

              {/* Loading overlay */}
              {!iframeLoaded && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white p-8 text-center dark:bg-gray-950">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 dark:bg-white">
                    <Globe className="h-6 w-6 text-white dark:text-gray-900" aria-hidden="true" />
                  </div>
                  <div
                    className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900 dark:border-gray-700 dark:border-t-white"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Opening {hostname}
                  </p>
                  <p className="max-w-sm text-xs text-gray-500">
                    {slowLoad
                      ? "Still loading. The portal may be slow - please wait or try Reload."
                      : "Loading the official website for you."}
                  </p>
                  {slowLoad && (
                    <button
                      type="button"
                      onClick={reload}
                      className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      Reload
                    </button>
                  )}
                </div>
              )}

              {/* One-time informational notice (non-blocking, dismissible) */}
              {noticeVisible && iframeLoaded && (
                <div className="absolute left-1/2 top-2 z-20 w-[calc(100%-1rem)] max-w-md -translate-x-1/2">
                  <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 text-xs text-gray-600 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-300">
                    <Info
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    <p className="flex-1 leading-relaxed">
                      {noticeText}
                    </p>
                    <button
                      type="button"
                      onClick={dismissNotice}
                      aria-label="Dismiss notice"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile sticky bottom Apply bar (with safe-area padding) */}
        <div className="shrink-0 md:hidden">
          <ApplicationFloatingCTA
            variant="mobile"
            officialUrl={officialUrl}
            hostname={hostname}
            sublabel={ctaSublabel}
            title={isDocument ? "Open Document" : undefined}
            onApply={handleApply}
          />
        </div>
      </div>

      {/* Desktop floating Apply CTA - always visible */}
      <ApplicationFloatingCTA
        variant="desktop"
        officialUrl={officialUrl}
        hostname={hostname}
        sublabel={ctaSublabel}
        title={isDocument ? "Open Document" : undefined}
        onApply={handleApply}
      />

      {/* Job info overlay drawer (never resizes the iframe) */}
      <ApplicationInfoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        type={type}
        title={title}
        organization={organization}
        hostname={hostname}
        officialUrl={officialUrl}
        sourceLabel={sourceLabel}
        deadlineLabel={deadlineLabel}
        updatedLabel={updatedLabel}
        infoRows={infoRows}
        ctaLabel={isDocument ? "Open Document" : undefined}
        aboutCopy={
          isDocument
            ? `This document opens from the ${sourceLabel.toLowerCase()} (${hostname}). ChayanJobsJobs only opens the verified official file for you.`
            : undefined
        }
        onReport={reportIssue}
      />
    </div>
  )
}
