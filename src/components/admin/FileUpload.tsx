"use client"

import { useState, useRef } from "react"
import { Upload, X, Loader2, FileText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toast"

interface FileUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  folder?: string
  accept?: string
  maxMb?: number
  label?: string
  className?: string
}

export function FileUpload({
  value,
  onChange,
  folder = "chayan/docs",
  accept = ".pdf,application/pdf",
  maxMb = 10,
  label = "PDF document",
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [manual, setManual] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isPdf = (name: string, type: string) =>
    type === "application/pdf" || name.toLowerCase().endsWith(".pdf")

  const upload = async (file: File) => {
    if (!isPdf(file.name, file.type)) {
      toast(`Please select a PDF file (${label})`, "destructive")
      return
    }
    if (file.size > maxMb * 1024 * 1024) {
      toast(`File must be under ${maxMb}MB`, "destructive")
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set("folder", folder)
      formData.set("kind", "pdf")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const json = await res.json()
      if (json.success) {
        onChange(json.url)
        toast("PDF uploaded", "success")
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

  if (value) {
    const filename = value.split("/").pop()?.split("?")[0] || "document.pdf"
    return (
      <div className={cn("rounded-lg border border-green-200 bg-green-50 p-3", className)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-green-600 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800">{filename}</p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-teal-700 hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Preview PDF
            </a>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(null)}>
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 transition-colors",
          dragOver ? "border-teal-400 bg-teal-50" : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100",
          uploading && "pointer-events-none opacity-60"
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) upload(file)
          }}
        />
        {uploading ? (
          <>
            <Loader2 className="mb-2 h-7 w-7 animate-spin text-teal-500" />
            <p className="text-sm text-gray-500">Uploading PDF...</p>
          </>
        ) : (
          <>
            <Upload className="mb-2 h-7 w-7 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">Click or drag PDF to upload</p>
            <p className="mt-1 text-xs text-gray-400">PDF only, max {maxMb}MB</p>
          </>
        )}
      </div>
      {manual ? (
        <Input
          placeholder="https://... paste PDF URL"
          onBlur={(e) => {
            const v = e.target.value.trim()
            if (v) {
              onChange(v)
              setManual(false)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              const v = (e.target as HTMLInputElement).value.trim()
              if (v) {
                onChange(v)
                setManual(false)
              }
            }
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setManual(true)}
          className="text-xs text-teal-700 hover:underline"
        >
          Or paste a URL instead
        </button>
      )}
    </div>
  )
}
