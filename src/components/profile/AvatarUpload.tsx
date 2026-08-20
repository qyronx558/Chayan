"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Upload,
  Loader2,
  Move,
  ZoomIn,
  Check,
  AlertCircle,
  RotateCcw,
  RotateCw,
  FlipHorizontal2,
  FlipVertical2,
  RefreshCw,
  Sun,
  Contrast,
  Droplets,
  Trash2,
  X,
} from "lucide-react"
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

interface SliderProps {
  label: string
  icon: typeof ZoomIn
  min: number
  max: number
  step: number
  value: number
  display: string
  onChange: (v: number) => void
  disabled?: boolean
}

function Slider({ label, icon: Icon, min, max, step, value, display, onChange, disabled }: SliderProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-gray-400" />
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium text-gray-500">{label}</span>
          <span className="tabular-nums font-semibold text-gray-700 dark:text-gray-300">{display}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-teal-600 disabled:opacity-50 dark:bg-gray-700"
          aria-label={label}
        />
      </div>
    </div>
  )
}

export function AvatarUpload({ src, name, onChange, className = "" }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(0)
  const [saturation, setSaturation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)

  const rotatedBounds = useCallback((deg: number) => {
    if (imgSize.w === 0 || imgSize.h === 0) return { w: 0, h: 0 }
    const rad = (deg * Math.PI) / 180
    const cos = Math.abs(Math.cos(rad))
    const sin = Math.abs(Math.sin(rad))
    return {
      w: imgSize.w * cos + imgSize.h * sin,
      h: imgSize.w * sin + imgSize.h * cos,
    }
  }, [imgSize])

  const displayedSize = useCallback(() => {
    const { w, h } = rotatedBounds(rotation)
    if (w === 0 || h === 0) return { w: 0, h: 0 }
    const viewW = VIEWPORT * scale
    const viewH = VIEWPORT * scale
    const ratio = w / h
    let dw = viewW
    let dh = viewH
    if (ratio > 1) dh = dw / ratio
    else dw = dh * ratio
    return { w: dw, h: dh }
  }, [rotatedBounds, rotation, scale])

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !uploading) setModalOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [modalOpen, uploading])

  useEffect(() => {
    if (!modalOpen) return
    setOffset((o) => clampOffset(o.x, o.y))
  }, [scale, rotation, modalOpen, clampOffset])

  const resetAll = () => {
    setScale(1)
    setRotation(0)
    setBrightness(0)
    setContrast(0)
    setSaturation(0)
    setFlipH(false)
    setFlipV(false)
    setOffset({ x: 0, y: 0 })
    setError(null)
  }

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
        resetAll()
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

      const W = img.naturalWidth
      const H = img.naturalHeight
      const { w: bbW, h: bbH } = rotatedBounds(rotation)

      const rot = document.createElement("canvas")
      rot.width = Math.max(1, Math.round(bbW))
      rot.height = Math.max(1, Math.round(bbH))
      const rctx = rot.getContext("2d")
      if (!rctx) throw new Error("Canvas not supported")
      rctx.translate(rot.width / 2, rot.height / 2)
      rctx.rotate((rotation * Math.PI) / 180)
      if (flipH) rctx.scale(-1, 1)
      if (flipV) rctx.scale(1, -1)
      rctx.drawImage(img, -W / 2, -H / 2)

      const { w: dispW, h: dispH } = displayedSize()
      const cropW = (VIEWPORT / dispW) * rot.width
      const cropH = (VIEWPORT / dispH) * rot.height
      const cropX = rot.width / 2 - cropW / 2 + (offset.x / dispW) * rot.width
      const cropY = rot.height / 2 - cropH / 2 + (offset.y / dispH) * rot.height

      const out = document.createElement("canvas")
      out.width = 512
      out.height = 512
      const octx = out.getContext("2d")
      if (!octx) throw new Error("Canvas not supported")
      octx.imageSmoothingQuality = "high"
      octx.filter = `brightness(${(100 + brightness) / 100}) contrast(${(100 + contrast) / 100}) saturate(${(100 + saturation) / 100})`
      octx.drawImage(rot, cropX, cropY, cropW, cropH, 0, 0, 512, 512)

      const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/jpeg", 0.92))
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
  const previewFilter = `brightness(${(100 + brightness) / 100}) contrast(${(100 + contrast) / 100}) saturate(${(100 + saturation) / 100})`

  const toolbarButton = (disabled = false) =>
    cn(
      "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 dark:border-gray-700 dark:text-gray-300 dark:hover:border-teal-700 dark:hover:bg-teal-950",
      disabled && "cursor-not-allowed opacity-40 hover:border-gray-200 hover:bg-transparent hover:text-gray-600 dark:hover:border-gray-700 dark:hover:bg-transparent dark:hover:text-gray-300"
    )

  return (
    <>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "absolute -bottom-1 -right-1 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg ring-4 ring-white transition-all hover:scale-110 hover:bg-teal-700 dark:ring-gray-950",
          className
        )}
        title="Change profile photo"
        aria-label="Change profile photo"
      >
        <Upload className="h-4 w-4" />
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
                <Upload className="h-4 w-4 text-teal-600" />
                Edit Profile Photo
              </h3>
              {!uploading && (
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
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
                      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                      filter: previewFilter,
                    }}
                  />
                )}
                <div className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-white/70 dark:ring-gray-900/70" />
                <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
                  <Move className="h-3 w-3" />
                  Drag to position
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  className={toolbarButton()}
                  onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                  title="Rotate left"
                  aria-label="Rotate left"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={toolbarButton()}
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate right"
                  aria-label="Rotate right"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={toolbarButton()}
                  onClick={() => setFlipH((f) => !f)}
                  title="Flip horizontally"
                  aria-label="Flip horizontally"
                >
                  <FlipHorizontal2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={toolbarButton()}
                  onClick={() => setFlipV((f) => !f)}
                  title="Flip vertically"
                  aria-label="Flip vertically"
                >
                  <FlipVertical2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={toolbarButton(scale === 1 && rotation === 0 && brightness === 0 && contrast === 0 && saturation === 0 && !flipH && !flipV)}
                  onClick={resetAll}
                  title="Reset adjustments"
                  aria-label="Reset adjustments"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5">
                <Slider
                  label="Zoom"
                  icon={ZoomIn}
                  min={1}
                  max={3}
                  step={0.05}
                  value={scale}
                  display={`${Math.round(scale * 100)}%`}
                  onChange={setScale}
                />
                <Slider
                  label="Rotation"
                  icon={RotateCw}
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  display={`${rotation}°`}
                  onChange={setRotation}
                />
                <Slider
                  label="Brightness"
                  icon={Sun}
                  min={-50}
                  max={50}
                  step={1}
                  value={brightness}
                  display={brightness === 0 ? "Normal" : `${brightness > 0 ? "+" : ""}${brightness}`}
                  onChange={setBrightness}
                />
                <Slider
                  label="Contrast"
                  icon={Contrast}
                  min={-50}
                  max={50}
                  step={1}
                  value={contrast}
                  display={contrast === 0 ? "Normal" : `${contrast > 0 ? "+" : ""}${contrast}`}
                  onChange={setContrast}
                />
                <Slider
                  label="Saturation"
                  icon={Droplets}
                  min={-50}
                  max={50}
                  step={1}
                  value={saturation}
                  display={saturation === 0 ? "Normal" : `${saturation > 0 ? "+" : ""}${saturation}`}
                  onChange={setSaturation}
                />
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