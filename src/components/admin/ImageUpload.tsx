"use client"

import { useState, useRef } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toast"

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  folder?: string
  className?: string
}

export function ImageUpload({ value, onChange, folder = "ChayanJobs", className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("Please select an image file", "destructive")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Image must be under 5MB", "destructive")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set("folder", folder)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (json.success) {
        onChange(json.url)
        toast("Image uploaded", "success")
      } else {
        toast(json.error || "Upload failed", "destructive")
      }
    } catch {
      toast("Upload failed. Check your connection.", "destructive")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) upload(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) upload(file)
  }

  if (value) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg border border-rule", className)}>
        <img src={value} alt="Uploaded" className="h-40 w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/50 text-paper hover:bg-ink/70"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="absolute bottom-0 left-0 right-0 bg-ink/70 p-2 text-xs text-paper">
          {value.split("/").pop()?.split("?")[0] || "Image"}
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
        dragOver ? "border-rule bg-paper-3" : "border-rule bg-paper-2 hover:border-rule-2 hover:bg-paper-3",
        uploading && "pointer-events-none opacity-60",
        className,
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      {uploading ? (
        <>
          <Loader2 className="mb-2 h-8 w-8 animate-spin text-brick" />
          <p className="text-sm text-muted-foreground">Uploading...</p>
        </>
      ) : (
        <>
          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">Click or drag to upload</p>
          <p className="text-xs text-muted-foreground mt-1">Max 5MB, images only</p>
        </>
      )}
    </div>
  )
}
