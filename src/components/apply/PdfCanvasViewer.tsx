"use client"

import { useEffect, useRef, useState } from "react"
import { Minus, Plus } from "lucide-react"
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist"

interface PdfCanvasViewerProps {
 /** Same-origin PDF address (/api/doc?url=...). */
 src: string
 title: string
 onLoad: () => void
 onError: () => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3
/** Upper bound for a page bitmap, to stay inside phone memory limits. */
const MAX_CANVAS_WIDTH = 2400

/**
 * PDF viewer drawn with pdf.js, for browsers that cannot show a PDF inside a
 * frame (Chrome on Android shows a blank box, iOS Safari only the first page).
 * Pages are drawn as they scroll into view and released when far away, so a
 * 200-page notice opens as fast as a 2-page one.
 */
export function PdfCanvasViewer({ src, title, onLoad, onError }: PdfCanvasViewerProps) {
 const scrollRef = useRef<HTMLDivElement | null>(null)
 const [loaded, setLoaded] = useState<{ src: string; pdf: PDFDocumentProxy; ratio: number } | null>(null)
 const [zoom, setZoom] = useState(1)
 const onLoadRef = useRef(onLoad)
 const onErrorRef = useRef(onError)
 useEffect(() => {
  onLoadRef.current = onLoad
  onErrorRef.current = onError
 })

 useEffect(() => {
  let cancelled = false
  let task: { promise: Promise<PDFDocumentProxy>; destroy: () => Promise<void> } | null = null
  void (async () => {
   try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
     "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
     import.meta.url
    ).toString()
    if (cancelled) return
    // /api/doc is one pass-through stream (no byte ranges).
    task = pdfjs.getDocument({ url: src, disableRange: true })
    const pdf = await task.promise
    if (cancelled) return
    const first = await pdf.getPage(1)
    const size = first.getViewport({ scale: 1 })
    if (cancelled) return
    setLoaded({ src, pdf, ratio: size.height / size.width })
    onLoadRef.current()
   } catch {
    if (!cancelled) onErrorRef.current()
   }
  })()
  return () => {
   cancelled = true
   void task?.destroy().catch(() => {})
  }
 }, [src])

 const doc = loaded && loaded.src === src ? loaded : null
 const zoomBtn =
  "flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted disabled:opacity-40"

 return (
  <div className="relative h-full w-full bg-muted">
   <div ref={scrollRef} className="h-full w-full overflow-auto overscroll-contain" role="document" aria-label={title}>
    {doc ? (
     <div className="mx-auto flex flex-col gap-2 p-2" style={{ width: `${zoom * 100}%`, maxWidth: zoom === 1 ? "56rem" : undefined }}>
      {Array.from({ length: doc.pdf.numPages }, (_, i) => (
       <PdfPage key={i} pdf={doc.pdf} pageNumber={i + 1} ratio={doc.ratio} zoom={zoom} scrollRef={scrollRef} />
      ))}
     </div>
    ) : null}
   </div>
   {doc ? (
    <div className="absolute left-2 top-2 z-10 flex items-center gap-0.5 rounded-xl border border-rule bg-card/95 p-1 shadow-lg backdrop-blur">
     <button type="button" aria-label="Zoom out" className={zoomBtn} disabled={zoom <= MIN_ZOOM} onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.5))}>
      <Minus className="h-4 w-4" />
     </button>
     <span className="min-w-10 text-center text-xs font-medium tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
     <button type="button" aria-label="Zoom in" className={zoomBtn} disabled={zoom >= MAX_ZOOM} onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.5))}>
      <Plus className="h-4 w-4" />
     </button>
    </div>
   ) : null}
  </div>
 )
}

interface PdfPageProps {
 pdf: PDFDocumentProxy
 pageNumber: number
 /** Height / width of page 1, used to reserve space before this page is drawn. */
 ratio: number
 zoom: number
 scrollRef: React.RefObject<HTMLDivElement | null>
}

function PdfPage({ pdf, pageNumber, ratio, zoom, scrollRef }: PdfPageProps) {
 const holderRef = useRef<HTMLDivElement | null>(null)
 const canvasRef = useRef<HTMLCanvasElement | null>(null)
 const [ownRatio, setOwnRatio] = useState<number | null>(null)

 useEffect(() => {
  const holder = holderRef.current
  const canvas = canvasRef.current
  if (!holder || !canvas) return
  let renderTask: RenderTask | null = null
  let stale = false
  let drawn = false

  const release = () => {
   renderTask?.cancel()
   renderTask = null
   drawn = false
   // A zero-sized canvas gives its bitmap memory back.
   canvas.width = 0
   canvas.height = 0
  }

  const draw = async () => {
   if (drawn) return
   drawn = true
   try {
    const page = await pdf.getPage(pageNumber)
    if (stale || !drawn) return
    const base = page.getViewport({ scale: 1 })
    setOwnRatio(base.height / base.width)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.min(holder.clientWidth * dpr, MAX_CANVAS_WIDTH)
    const viewport = page.getViewport({ scale: width / base.width })
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    renderTask = page.render({ canvasContext: ctx, viewport })
    await renderTask.promise
   } catch {
    // Cancelled (scrolled away / zoom changed) or a damaged page: leave blank.
   }
  }

  const observer = new IntersectionObserver(
   (entries) => {
    for (const entry of entries) {
     if (entry.isIntersecting) void draw()
     else if (drawn) release()
    }
   },
   { root: scrollRef.current, rootMargin: "150% 0px" }
  )
  observer.observe(holder)
  return () => {
   stale = true
   observer.disconnect()
   renderTask?.cancel()
  }
 }, [pdf, pageNumber, zoom, scrollRef])

 return (
  <div
   ref={holderRef}
   className="w-full overflow-hidden bg-white shadow-sm"
   style={{ aspectRatio: `1 / ${ownRatio ?? ratio}` }}
  >
   <canvas ref={canvasRef} className="block h-full w-full" aria-label={`Page ${pageNumber}`} />
  </div>
 )
}
