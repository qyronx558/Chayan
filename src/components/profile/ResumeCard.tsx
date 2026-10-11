"use client"

import { useRef, useState } from "react"
import { Download, FileText, Loader2, Upload } from "lucide-react"
import { DataCard } from "@/components/admin/dashboard/DataCard"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { formatDate } from "@/lib/utils"

export interface ResumeState {
  fileName: string
  fileType: string
  fileSize: number
  updatedAt: string
}

interface ResumeCardProps {
  resume: ResumeState | null
  loading: boolean
  onChanged: (next: ResumeState | null) => void
}

const ALLOWED = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
const MAX_SIZE = 5 * 1024 * 1024

export function ResumeCard({ resume, loading, onChanged }: ResumeCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!ALLOWED.includes(file.type) && !/\.pdf$/i.test(file.name) && !/\.docx$/i.test(file.name)) {
      toast("Only PDF or DOCX files are supported", "destructive")
      return
    }
    if (file.size > MAX_SIZE) {
      toast("File must be under 5MB", "destructive")
      return
    }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/user/resume", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || "Upload failed", "destructive")
        return
      }
      const next: ResumeState = {
        fileName: json.data.fileName,
        fileType: json.data.fileType ?? file.type,
        fileSize: json.data.fileSize ?? file.size,
        updatedAt: json.data.updatedAt ?? new Date().toISOString(),
      }
      onChanged(next)
      toast("Resume uploaded", "success")
    } catch {
      toast("Upload failed", "destructive")
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    const prev = resume
    if (!prev) return
    onChanged(null)
    try {
      const res = await fetch("/api/user/resume", { method: "DELETE" })
      if (!res.ok) {
        onChanged(prev)
        const json = await res.json().catch(() => ({}))
        toast((json as { error?: string }).error || "Could not remove resume", "destructive")
        return
      }
      toast("Resume removed", "success", { label: "Undo", onClick: () => onChanged(prev) })
    } catch {
      onChanged(prev)
      toast("Could not remove resume", "destructive")
    }
  }

  async function handleDownload() {
    if (!resume) return
    try {
      const res = await fetch("/api/user/resume")
      const json = await res.json()
      const detail = json?.data ?? {}
      const lines = [
        `File: ${resume.fileName}`,
        `Type: ${resume.fileType}`,
        `Size: ${resume.fileSize} bytes`,
        `Updated: ${resume.updatedAt}`,
        ``,
        `Skills: ${Array.isArray(detail.skills) ? detail.skills.join(", ") : ""}`,
        `Education: ${detail.education ?? ""}`,
        `Experience: ${detail.experience ?? ""}`,
      ]
      const blob = new Blob([lines.join("\n")], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = resume.fileName.replace(/\.(pdf|docx)$/i, "") + "-summary.txt"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast("Resume summary downloaded", "success")
    } catch {
      toast("Could not download resume", "destructive")
    }
  }

  if (loading) {
    return (
      <DataCard title="Resume" subtitle="Your career document">
        <Skeleton className="h-28 rounded-lg" />
      </DataCard>
    )
  }

  return (
    <DataCard
      title="Resume"
      subtitle="PDF or DOCX, max 5 MB"
      action={
        resume ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        ) : undefined
      }
    >
      <div id="resume-card">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          aria-label="Choose resume file"
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            e.target.value = ""
          }}
        />
        {resume ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white" aria-hidden="true">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{resume.fileName}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {(resume.fileSize / 1024).toFixed(1)} KB · updated {formatDate(new Date(resume.updatedAt), "dd MMM yyyy")}
                  </span>
                </span>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
                  {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                  Replace
                </Button>
                <Button variant="outline" size="sm" onClick={handleRemove} className="text-red-600 hover:text-red-700">
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              handleFile(e.dataTransfer.files?.[0])
            }}
            className="flex w-full flex-col items-center rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center transition-colors hover:border-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-white/15"
          >
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-700/10 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300" aria-hidden="true">
              <Upload className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">Drop your resume here or browse</span>
            <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">PDF or DOCX, max 5 MB</span>
            <span className="mt-4 inline-flex items-center rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Choose file
            </span>
          </button>
        )}
      </div>
    </DataCard>
  )
}
