"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, Info, RefreshCw, X } from "lucide-react"
import { ApplicationTopBar } from "@/components/apply/ApplicationTopBar"
import { ApplicationToolRail } from "@/components/apply/ApplicationToolRail"
import { ApplicationIframe } from "@/components/apply/ApplicationIframe"
import { ApplicationFloatingCTA } from "@/components/apply/ApplicationFloatingCTA"
import { ApplicationInfoDrawer } from "@/components/apply/ApplicationInfoDrawer"
import { ApplicationFallback } from "@/components/apply/ApplicationFallback"
import { ApplicationMobileMenu } from "@/components/apply/ApplicationMobileMenu"
import { BrowserTabStrip } from "@/components/browse/BrowserTabStrip"
import { BrowserAddressBar } from "@/components/browse/BrowserAddressBar"
import { BrowserNewTab } from "@/components/browse/BrowserNewTab"
import { useBrowserTabs } from "@/components/browse/useBrowserTabs"
import type { ApplicationShellProps } from "@/components/apply/application-types"
import { isDocumentApplication } from "@/components/apply/application-types"
import { trackApplyEvent } from "@/lib/apply-analytics"
import { buildDocProxyUrl, buildHtmlProxyUrl, getExternalHostname, normalizeExternalUrl } from "@/lib/apply-room"
import { downloadPdfFile } from "@/lib/download-pdf"

type FrameStatus = "checking" | "allowed" | "blocked" | "unknown"
type ViewMode = "direct" | "preview"

const RAIL_STORAGE_KEY = "cj-apply-rail-collapsed"
const LOAD_TIMEOUT_MS = 12000

/**
 * Unified in-app browser shell for gov + private + documents + /browse.
 * Clean + simple: TopBar / TabStrip / AddressBar / content / CTA.
 * Tabs stay inside ChayanJobs; search goes to internal /search;
 * PDFs open + download end-to-end from ChayanJobs origin (/api/doc).
 */
export function ApplicationShell(props: ApplicationShellProps) {
  const {
    type,
    jobId,
    slug,
    title,
    organization,
    officialUrl,
    deadlineLabel,
    updatedLabel,
    sourceLabel,
    backHref,
    backLabel,
    infoRows,
  } = props

  const router = useRouter()
  const scope = useMemo(() => `${type}:${slug}`, [type, slug])
  const { tabs, activeId, activeTab, openTab, closeTab, switchTab, navigateActive, newTab } =
    useBrowserTabs(scope, officialUrl, title)

  const currentUrl = activeTab?.url ?? officialUrl
  const isBlank = !currentUrl
  const currentHostname = currentUrl ? getExternalHostname(currentUrl) : "New tab"
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
  const [checkIsPdf, setCheckIsPdf] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("direct")
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [blocked, setBlocked] = useState(false)
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

  const analyticsBase = useMemo(
    () => ({ job_id: jobId, job_slug: slug, job_type: type, destination_domain: currentHostname }),
    [jobId, slug, type, currentHostname]
  )
  const openedTracked = useRef(false)
  const previewTracked = useRef<string | null>(null)

  const isDocument = isDocumentApplication(type)
  const isPdf = (activeTab?.kind === "pdf") || checkIsPdf || (isDocument && /\.pdf(\?|#|$)/i.test(currentUrl))

  const previewUrl = useMemo(() => {
    if (!currentUrl) return null
    return isPdf ? buildDocProxyUrl(currentUrl) : buildHtmlProxyUrl(currentUrl)
  }, [currentUrl, isPdf])

  const downloadUrl = useMemo(() => {
    if (!currentUrl) return null
    if (!isPdf && !isDocument) return null
    return `${buildDocProxyUrl(currentUrl, true)}&filename=${encodeURIComponent(slug)}`
  }, [currentUrl, isPdf, isDocument, slug])

  const downloadFilename = useMemo(() => `${slug}.pdf`, [slug])
  const iframeSrc = viewMode === "preview" && previewUrl ? previewUrl : currentUrl

  const dismissNotice = useCallback(() => {
    setNoticeVisible(false)
    try {
      window.sessionStorage.setItem(`cj-apply-notice-${slug}`, "1")
    } catch {
      // Ignore storage failures.
    }
  }, [slug])

  // application_page_opened + browse_opened (once per shell mount).
  useEffect(() => {
    if (openedTracked.current) return
    openedTracked.current = true
    trackApplyEvent("application_page_opened", analyticsBase)
    trackApplyEvent("browse_opened", analyticsBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per mount
  }, [])

  const runFrameCheck = useCallback(async (url: string) => {
    setFrameStatus("checking")
    setCheckIsPdf(/\.pdf(\?|#|$)/i.test(url))
    try {
      const res = await fetch(`/api/apply/check?url=${encodeURIComponent(url)}`)
      const json = await res.json()
      if (typeof json?.isPdf === "boolean") setCheckIsPdf(json.isPdf)
      if (json?.frameable === false) {
        setFrameStatus("blocked")
        // Auto-try the stay-inside preview instead of showing a blank frame.
        setViewMode("preview")
        if (previewTracked.current !== url) {
          previewTracked.current = url
          trackApplyEvent(json?.isPdf ? "pdf_preview_shown" : "proxy_preview_shown", {
            job_id: jobId, job_slug: slug, job_type: type, destination_domain: getExternalHostname(url),
          })
          trackApplyEvent("iframe_failed", {
            job_id: jobId, job_slug: slug, job_type: type, destination_domain: getExternalHostname(url),
          })
        }
      } else if (json?.frameable === true) {
        setFrameStatus("allowed")
      } else {
        setFrameStatus("unknown")
      }
    } catch {
      setFrameStatus("unknown")
    }
  }, [jobId, slug, type])

  // Reset per-tab view state when switching tabs / navigating.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- tab switch must reset view state */
    setViewMode("direct")
    setIframeLoaded(false)
    setBlocked(false)
    setSlowLoad(false)
    /* eslint-enable react-hooks/set-state-in-effect */
    previewTracked.current = null
    if (currentUrl) runFrameCheck(currentUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on tab identity change
  }, [activeId, currentUrl])

  // New destination arrived via props (e.g. /browse?url= changed) ->
  // open it as a tab INSIDE the browser instead of replacing the page.
  // openTab dedups, so the initial mount is a safe no-op.
  useEffect(() => {
    const normalized = normalizeExternalUrl(officialUrl)
    if (normalized) openTab(normalized, { title, switchTo: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to inbound destination only
  }, [officialUrl, title])

  // Slow-load hint if the iframe takes too long.
  useEffect(() => {
    if (iframeLoaded || blocked) return
    const t = window.setTimeout(() => setSlowLoad(true), LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(t)
  }, [iframeKey, currentUrl, viewMode, iframeLoaded, blocked])

  const reload = useCallback(() => {
    setIframeLoaded(false)
    setBlocked(false)
    setSlowLoad(false)
    setIframeKey((k) => k + 1)
    if (currentUrl) runFrameCheck(currentUrl)
  }, [runFrameCheck, currentUrl])

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true)
    setSlowLoad(false)
    trackApplyEvent("iframe_loaded", analyticsBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
  }, [analyticsBase])

  const handleIframeError = useCallback(() => {
    if (viewMode === "direct" && previewUrl) {
      // First failure -> stay inside via preview. Only interstitial if preview fails too.
      setViewMode("preview")
      setIframeLoaded(false)
      trackApplyEvent(isPdf ? "pdf_preview_shown" : "proxy_preview_shown", analyticsBase)
    } else {
      setBlocked(true)
      trackApplyEvent("iframe_failed", analyticsBase)
      trackApplyEvent("interstitial_shown", analyticsBase)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
  }, [viewMode, previewUrl, isPdf, analyticsBase])

  const tryDirect = useCallback(() => {
    setViewMode("direct")
    setBlocked(false)
    setIframeLoaded(false)
    setSlowLoad(false)
    setIframeKey((k) => k + 1)
  }, [])

  const tryPreview = useCallback(() => {
    setViewMode("preview")
    setBlocked(false)
    setIframeLoaded(false)
    setSlowLoad(false)
    setIframeKey((k) => k + 1)
    trackApplyEvent("proxy_preview_retry", analyticsBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
  }, [analyticsBase])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
  }, [analyticsBase])

  const openInfo = useCallback(() => {
    setDrawerOpen(true)
    trackApplyEvent("job_info_opened", analyticsBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
  }, [analyticsBase])

  const reportIssue = useCallback(() => {
    trackApplyEvent("report_issue_clicked", analyticsBase)
    router.push("/contact")
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
  }, [router, analyticsBase])

  const handleApply = useCallback(() => {
    trackApplyEvent("apply_cta_clicked", analyticsBase)
    trackApplyEvent("official_site_opened", analyticsBase)
    trackApplyEvent("continue_clicked", analyticsBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
  }, [analyticsBase])

  const handleDownload = useCallback((e?: { preventDefault(): void }) => {
    // Stop the anchor's same-tab navigation: the helper downloads via blob
    // (stays in place) and only opens a new tab if the proxy fails.
    e?.preventDefault();
    trackApplyEvent("pdf_download_clicked", analyticsBase);
    if (!downloadUrl) return;
    void (async () => {
      const result = await downloadPdfFile({
        proxyUrl: downloadUrl,
        directUrl: currentUrl,
        filename: downloadFilename,
      });
      if (result === "direct") trackApplyEvent("official_site_opened", analyticsBase);
    })();
  }, [analyticsBase, downloadUrl, currentUrl, downloadFilename])

  const handleNavigate = useCallback((url: string) => {
    navigateActive(url)
  }, [navigateActive])

  const handleOpenInNewTab = useCallback((url: string) => {
    const t = openTab(url, { switchTo: true })
    if (t) trackApplyEvent("browser_tab_opened", analyticsBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
  }, [openTab, analyticsBase])

  const handleCloseTab = useCallback((id: string) => {
    closeTab(id)
    trackApplyEvent("browser_tab_closed", analyticsBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
  }, [closeTab, analyticsBase])

  const handleNewTab = useCallback(() => {
    newTab()
    trackApplyEvent("browser_tab_opened", analyticsBase)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable payload per render
  }, [newTab, analyticsBase])

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

  const showFallback = blocked
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
          officialUrl={currentUrl}
          hostname={currentHostname}
          onReport={reportIssue}
        />
      </div>

      {/* Main column: top bar + tabs + address + official website */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ApplicationTopBar
          type={type}
          title={title}
          organization={organization}
          hostname={currentHostname}
          deadlineLabel={deadlineLabel}
          sourceLabel={sourceLabel}
          backHref={backHref}
          backLabel={backLabel}
          mobileMenu={
            <ApplicationMobileMenu
              hostname={currentHostname}
              officialUrl={currentUrl}
              onInfo={openInfo}
              onReload={reload}
              onShare={share}
              onReport={reportIssue}
              downloadUrl={downloadUrl}
              downloadFilename={downloadFilename}
              onDownload={handleDownload}
            />
          }
        />

        <BrowserTabStrip
          tabs={tabs}
          activeId={activeId}
          onSwitch={switchTab}
          onClose={handleCloseTab}
          onNew={handleNewTab}
        />

        <BrowserAddressBar
          currentUrl={currentUrl}
          hostname={currentHostname}
          loading={!isBlank && !iframeLoaded && !showFallback}
          analytics={analyticsBase}
          onNavigate={handleNavigate}
          onReload={reload}
          onShare={share}
          onOpenInNewTab={handleOpenInNewTab}
        />

        <div className="relative min-h-0 flex-1 bg-white dark:bg-white">
          {isBlank ? (
            <BrowserNewTab backHref={backHref} backLabel={backLabel} onNavigate={handleNavigate} />
          ) : showFallback ? (
            <ApplicationFallback
              organization={organization}
              hostname={currentHostname}
              officialUrl={currentUrl}
              sourceLabel={sourceLabel}
              headline={isDocument ? "Official document" : undefined}
              isPdf={isPdf}
              previewUrl={previewUrl}
              downloadUrl={downloadUrl}
              downloadFilename={downloadFilename}
              onReload={reload}
              onTryDirect={tryDirect}
              onTryPreview={previewUrl ? tryPreview : undefined}
              onReport={reportIssue}
              onOpenOfficial={handleApply}
              onDownload={handleDownload}
            />
          ) : (
            <>
              <ApplicationIframe
                src={iframeSrc}
                title={title}
                iframeKey={iframeKey}
                isPdf={viewMode === "preview" ? isPdf : activeTab?.kind === "pdf"}
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
                    {frameStatus === "checking" && !iframeLoaded
                      ? `Checking ${currentHostname}`
                      : `Opening ${currentHostname}`}
                    {viewMode === "preview" ? " preview" : ""}
                  </p>
                  <p className="max-w-sm text-xs text-gray-500">
                    {slowLoad
                      ? "Still loading. The portal may be slow - please wait or try Reload."
                      : viewMode === "preview"
                        ? "Loading the in-app preview for you."
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

              {/* Preview-mode pill: one-tap switch back to direct */}
              {viewMode === "preview" && iframeLoaded && !isPdf && (
                <div className="absolute left-1/2 top-2 z-20 w-[calc(100%-1rem)] max-w-md -translate-x-1/2">
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white/95 px-3 py-2 text-xs text-gray-600 shadow-lg backdrop-blur dark:border-emerald-900 dark:bg-gray-900/95 dark:text-gray-300">
                    <Info className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <p className="flex-1 leading-relaxed">In-app preview. Some buttons may need the direct site.</p>
                    <button
                      type="button"
                      onClick={tryDirect}
                      className="shrink-0 rounded-md bg-emerald-600 px-2 py-1 font-semibold text-white hover:bg-emerald-700"
                    >
                      Direct
                    </button>
                  </div>
                </div>
              )}

              {/* One-time informational notice (non-blocking, dismissible) */}
              {noticeVisible && iframeLoaded && viewMode === "direct" && (
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

        {/* Mobile sticky bottom CTA bar (hidden on blank new-tab page) */}
        {!isBlank ? (
          <div className="shrink-0 md:hidden">
            <ApplicationFloatingCTA
              variant="mobile"
              officialUrl={currentUrl}
              hostname={currentHostname}
              sublabel={ctaSublabel}
              title={isDocument ? (downloadUrl ? "Download PDF" : "Open Document") : undefined}
              onApply={handleApply}
              downloadUrl={isDocument || isPdf ? downloadUrl : null}
              downloadFilename={downloadFilename}
              onDownload={handleDownload}
            />
          </div>
        ) : null}
      </div>

      {/* Desktop floating CTA - hidden on blank new-tab page */}
      {!isBlank ? (
        <ApplicationFloatingCTA
          variant="desktop"
          officialUrl={currentUrl}
          hostname={currentHostname}
          sublabel={ctaSublabel}
          title={isDocument ? (downloadUrl ? "Download PDF" : "Open Document") : undefined}
          onApply={handleApply}
          downloadUrl={isDocument || isPdf ? downloadUrl : null}
          downloadFilename={downloadFilename}
          onDownload={handleDownload}
        />
      ) : null}

      {/* Job info overlay drawer (never resizes the iframe) */}
      <ApplicationInfoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        type={type}
        title={title}
        organization={organization}
        hostname={currentHostname}
        officialUrl={currentUrl}
        sourceLabel={sourceLabel}
        deadlineLabel={deadlineLabel}
        updatedLabel={updatedLabel}
        infoRows={infoRows}
        ctaLabel={isDocument ? (downloadUrl ? "Download PDF" : "Open Document") : undefined}
        downloadUrl={isDocument || isPdf ? downloadUrl : null}
        downloadFilename={downloadFilename}
        onDownload={handleDownload}
        onApply={handleApply}
        aboutCopy={
          isDocument
            ? `This document opens from the ${sourceLabel.toLowerCase()} (${currentHostname}). ChayanJobs only opens the verified official file for you.`
            : undefined
        }
        onReport={reportIssue}
      />
    </div>
  )
}
