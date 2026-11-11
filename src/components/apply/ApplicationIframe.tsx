"use client"

import type { RefObject } from "react"
import { PdfCanvasViewer } from "@/components/apply/PdfCanvasViewer"

interface ApplicationIframeProps {
 src: string
 title: string
 /** Changing the key remounts the frame (reload / switching how a link opens). */
 frameKey: string
 /** The address is a PDF: use a PDF viewer instead of a sandboxed page frame. */
 isPdf?: boolean
 /** Draw the PDF with pdf.js (browsers that cannot show a PDF in a frame). */
 canvasPdf?: boolean
 /** Shell attaches this to verify postMessage events come from this frame. */
 iframeRef?: RefObject<HTMLIFrameElement | null>
 onLoad: () => void
 onError: () => void
}

// What the official site may do inside the frame. Downloads (admit cards,
// receipts) and popups that behave like normal tabs (payment gateways, print
// views) are needed for real application flows. Top navigation stays limited
// to a user's own click so a page cannot yank the visitor off ChayanJobs.
const PAGE_SANDBOX = [
 "allow-forms",
 "allow-modals",
 "allow-popups",
 "allow-popups-to-escape-sandbox",
 "allow-same-origin",
 "allow-scripts",
 "allow-downloads",
 "allow-storage-access-by-user-activation",
 "allow-top-navigation-by-user-activation",
].join(" ")

// Device features application forms ask for (live photo capture, exam-centre
// location, card payment sheets, copy buttons, OTP autofill).
const PAGE_ALLOW = "fullscreen; camera; geolocation; payment; clipboard-write; otp-credentials"

const FRAME_CLASS = "block h-full w-full border-0 bg-background"

/**
 * Frame filling all remaining shell space. Three ways to show a link:
 * a sandboxed page frame, the browser's own PDF viewer (it refuses to run
 * inside a sandbox, so that frame has none), or the pdf.js canvas viewer.
 */
export function ApplicationIframe({ src, title, frameKey, isPdf, canvasPdf, iframeRef, onLoad, onError }: ApplicationIframeProps) {
 if (isPdf && canvasPdf && src.startsWith("/")) {
  return <PdfCanvasViewer key={`pdf-canvas-${frameKey}`} src={src} title={title} onLoad={onLoad} onError={onError} />
 }
 if (isPdf) {
  return (
   <iframe
    key={`pdf-${frameKey}`}
    ref={iframeRef}
    src={src}
    title={title}
    onLoad={onLoad}
    onError={onError}
    className={FRAME_CLASS}
    allow="fullscreen"
    allowFullScreen
    referrerPolicy="no-referrer"
   />
  )
 }
 return (
  <iframe
   key={`page-${frameKey}`}
   ref={iframeRef}
   src={src}
   title={title}
   onLoad={onLoad}
   onError={onError}
   className={FRAME_CLASS}
   allow={PAGE_ALLOW}
   allowFullScreen
   referrerPolicy="no-referrer"
   sandbox={PAGE_SANDBOX}
  />
 )
}
