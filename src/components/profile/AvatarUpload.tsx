"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Camera, Loader2, Move, Trash2, ZoomIn, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

interface AvatarUploadProps {
  src: string | null
  name: string
  onChange: (url: string | null) => void
  className?: string
}

const VIEWPORT = 288

export function AvatarUpload({ src, name, onChange, className = "" }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)

  const displayedSize = useCallback(() => {
    if (imgSize.w === 0 || imgSize.h === 0) return { w: 0, h: 0 }
    const ratio = imgSize.w / imgSize.h
    let w = VIEWPORT * scale
    let h = VIEWPORT * scale
    if (ratio > 1) h = w / ratio
    else w = h * ratio
    return { w, h }
  }, [imgSize, scale])

  const clampOffset = useCallback(
    (x: number, y: number) => {
      const { w, h } = displayedSize()
      const maxX = Math.max(0, (w - VIEWPORT) / 2)
      const maxY = Math.max(0, (h - VIEWPORT) / 2)
      return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) }
    },
    [displayedSize]
  )

  useEffect(() => {
    if (!modalOpen) return
    setOffset((o) => clampOffset(o.x, o.y))
  }, [scale, modalOpen, clampOffset])

  const onFileSelected = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, WEBP)")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      const img = new Image()
      img.onload = () => {
        setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
        setScale(1)
        setOffset({ x: 0, y: 0 })
        setError(null)
        setPreviewUrl(url)
        setModalOpen(true)
      }
      img.src = url
    }
    reader.readAsDataURL(file)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset(clampOffset(dragRef.current.baseX + dx, dragRef.current.baseY + dy))
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  const applyCrop = async () => {
    if (!previewUrl) return
    setUploading(true)
    setError(null)
    try {
      const img = new Image()
      img.src = previewUrl
      await img.decode()
      const { w, h } = displayedSize()
      const sourceX = (img.naturalWidth - (VIEWPORT / w) * img.naturalWidth) / 2 + (offset.x / w) * img.naturalWidth
      const sourceY = (img.naturalHeight - (VIEWPORT / h) * img.naturalHeight) / 2 + (offset.y / h) * img.naturalHeight
      const sourceW = (VIEWPORT / w) * img.naturalWidth
      const sourceH = (VIEWPORT / h) * img.naturalHeight

      const canvas = document.createElement("canvas")
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas not supported")
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, 256, 256)

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92))
      if (!blob) throw new Error("Could not process image")

      const formData = new FormData()
      formData.append("file", blob, "avatar.jpg")

      const res = await fetch("/api/users/me/avatar", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Upload failed")
        return
      }
      onChange(json.url)
      toast("Profile photo updated", "success")
      setModalOpen(false)
    } catch {
      setError("Could not process the image. Please try another one.")
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = async () => {
    setUploading(true)
    setError(null)
    try {
      const res = await fetch("/api/users/me/avatar", { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || "Could not remove photo")
        return
      }
      onChange(null)
      toast("Profile photo removed", "success")
      setModalOpen(false)
    } catch {
      setError("Could not remove photo")
    } finally {
      setUploading(false)
    }
  }

  const { w, h } = displayedSize()

  return (
    <>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white text-teal-700 shadow-md transition-all hover:scale-105 hover:shadow-lg dark:bg-gray-900 dark:text-teal-300",
          className
        )}
        title="Change profile photo"
      >
        <Camera className="h-4 w-4" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="user"
        className="hidden"
        onChange={(e) => {
          onFileSelected(e.target.files?.[0])
          e.target.value = ""
        }}
      />

      {modalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !uploading) setModalOpen(false)
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                <Camera className="h-4 w-4 text-teal-600" />
                Update Profile Photo
              </h3>
              {!uploading && (
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="p-5">
              <div
                className="relative mx-auto h-[288px] w-[288px] touch-none select-none overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Avatar preview"
                    draggable={false}
                    className="absolute left-1/2 top-1/2 max-w-none"
                    style={{
                      width: w,
                      height: h,
                      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                    }}
                  />
                )}
                <div className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-white/70 dark:ring-gray-900/70" />
                <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
                  <Move className="h-3 w-3" />
                  Drag to position
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <ZoomIn className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-teal-600 dark:bg-gray-700"
                  aria-label="Zoom"
                />
                <span className="w-10 text-right text-xs font-medium text-gray-500">{Math.round(scale * 100)}%</span>
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="mt-5 flex items-center gap-2">
                <Button onClick={applyCrop} disabled={uploading || !previewUrl} className="flex-1">
                  {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Use Photo
                </Button>
                {src && (
                  <Button variant="outline" onClick={removePhoto} disabled={uploading}>
                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                    Remove
                  </Button>
                )}
              </div>

              <p className="mt-3 text-center text-[11px] text-gray-400">
                {name ? `${name} · ` : ""}JPG, PNG, WEBP or GIF — max 5MB
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}