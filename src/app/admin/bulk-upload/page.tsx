"use client"

import { useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { isSuperAdmin } from "@/lib/roles"
import { cn } from "@/lib/utils"
import {
  Briefcase, FileText, IdCard, GraduationCap, BookOpen, KeyRound, FolderKanban, Landmark,
  Download, UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, RotateCcw, Building2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BULK_MODULES, BULK_MAX_ROWS, type BulkModuleDef, type BulkModuleId } from "@/lib/bulk-upload/modules"
import { downloadTemplate, parseUploadFile } from "@/lib/bulk-upload/client"

const iconMap: Record<BulkModuleId, React.ElementType> = {
  jobs: Briefcase,
  results: FileText,
  "admit-cards": IdCard,
  admissions: GraduationCap,
  syllabus: BookOpen,
  "answer-keys": KeyRound,
  categories: FolderKanban,
  departments: Landmark,
}

interface RowError {
  row: number
  message: string
}

interface BulkResult {
  module: string
  total: number
  imported: number
  skipped: number
  newDepartments: number
  newCategories: number
  errors: RowError[]
}

export default function BulkUploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [moduleId, setModuleId] = useState<BulkModuleId>("results")
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[] | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsing, setParsing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState<BulkResult | null>(null)

  if (status === "loading") return null
  if (!session || !isSuperAdmin(session.user.role)) { router.push("/login"); return null }

  const mod: BulkModuleDef = BULK_MODULES.find((m) => m.id === moduleId)!

  function selectModule(id: BulkModuleId) {
    setModuleId(id)
    resetFile()
  }

  function resetFile() {
    setFileName(null)
    setParsedRows(null)
    setParseError(null)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleFile(file: File) {
    resetFile()
    setParsing(true)
    try {
      const parsed = await parseUploadFile(file, mod)
      if (parsed.rows.length > BULK_MAX_ROWS) {
        throw new Error(`Too many rows (${parsed.rows.length}). Maximum ${BULK_MAX_ROWS} per upload.`)
      }
      setFileName(file.name)
      setParsedRows(parsed.rows)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Could not read the file.")
    } finally {
      setParsing(false)
    }
  }

  async function handleUpload() {
    if (!parsedRows) return
    setUploading(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: moduleId, rows: parsedRows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setResult(data.result as BulkResult)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  const hasResult = result !== null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bulk Upload</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload an Excel (.xlsx) or CSV file to add many records at once. Duplicates (same title or slug) are
          automatically skipped - existing records are never changed. Max {BULK_MAX_ROWS} rows per file.
        </p>
      </div>

      {/* Module picker */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {BULK_MODULES.map((m) => {
          const Icon = iconMap[m.id]
          const active = m.id === moduleId
          return (
            <button
              key={m.id}
              onClick={() => selectModule(m.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all",
                active
                  ? "border-teal-600 bg-teal-50 text-teal-700 shadow-sm dark:border-teal-500 dark:bg-teal-500/10 dark:text-teal-300"
                  : "border-gray-200 bg-white text-gray-600 hover:border-teal-600/40 hover:text-teal-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
              )}
            >
              <Icon className="h-5 w-5" />
              {m.label}
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left: steps */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upload {mod.label}</CardTitle>
            <CardDescription className="text-xs">{mod.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">1</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Download the template</p>
                <p className="text-xs text-gray-500">Fill your data into these exact columns - order doesn&apos;t matter.</p>
                <Button variant="outline" size="sm" className="mt-2 gap-2 text-xs" onClick={() => downloadTemplate(mod)}>
                  <Download className="h-3.5 w-3.5" /> {mod.id}-template.xlsx
                </Button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">2</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Choose your filled file</p>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    const f = e.dataTransfer.files?.[0]
                    if (f) handleFile(f)
                  }}
                  className={cn(
                    "mt-2 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-4 py-5 transition-colors",
                    dragOver
                      ? "border-teal-600 bg-teal-50/60"
                      : "border-gray-200 hover:border-teal-600/50 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                  )}
                >
                  {parsing ? (
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                  ) : fileName ? (
                    <FileSpreadsheet className="h-6 w-6 shrink-0 text-green-600" />
                  ) : (
                    <UploadCloud className="h-6 w-6 shrink-0 text-gray-400" />
                  )}
                  <div className="min-w-0 text-xs">
                    {parsing ? (
                      <p className="font-medium">Reading file…</p>
                    ) : fileName && parsedRows ? (
                      <>
                        <p className="truncate font-semibold">{fileName}</p>
                        <p className="text-gray-500">{parsedRows.length} data row{parsedRows.length === 1 ? "" : "s"} ready</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">Drop .xlsx / .csv here or click to browse</p>
                        <p className="text-gray-500">First row must be the column headers</p>
                      </>
                    )}
                  </div>
                  {fileName && !parsing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto shrink-0 gap-1 text-xs"
                      onClick={(e) => { e.stopPropagation(); resetFile() }}
                    >
                      <RotateCcw className="h-3 w-3" /> Clear
                    </Button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />
                {parseError && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-md border border-red-100 bg-red-50 p-2 text-xs text-red-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {parseError}
                  </p>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <span className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                parsedRows && !uploading ? "bg-teal-600" : "bg-gray-300"
              )}>3</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Import into database</p>
                <p className="text-xs text-gray-500">Departments & categories are created first, then every row is validated and saved.</p>
                <Button
                  className="mt-2 gap-2"
                  disabled={!parsedRows || uploading || parsing}
                  onClick={handleUpload}
                >
                  {uploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Importing {parsedRows?.length} rows…</>
                  ) : (
                    <><UploadCloud className="h-4 w-4" /> Upload & Import{parsedRows ? ` (${parsedRows.length} rows)` : ""}</>
                  )}
                </Button>
              </div>
            </div>

            {/* Result summary */}
            {hasResult && (
              <div className={cn(
                "rounded-xl border p-4",
                result.errors.length > 0 ? "border-amber-200 bg-amber-50/50" : "border-green-200 bg-green-50/50"
              )}>
                <div className="flex items-center gap-2">
                  {result.errors.length > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  <p className="text-sm font-bold">Import finished - {result.imported} added, {result.skipped} duplicates skipped</p>
                </div>
                <div className="mt-3 flex gap-3 text-center">
                  <div className="flex-1 rounded-md bg-green-100/80 p-2">
                    <div className="text-lg font-bold text-green-700">{result.imported}</div>
                    <div className="text-[11px] font-medium text-green-600">Imported</div>
                  </div>
                  <div className="flex-1 rounded-md bg-teal-100/60 p-2">
                    <div className="text-lg font-bold text-teal-700">{result.skipped}</div>
                    <div className="text-[11px] font-medium text-teal-600">Skipped</div>
                  </div>
                  <div className="flex-1 rounded-md bg-red-100/80 p-2">
                    <div className="text-lg font-bold text-red-700">{result.errors.length}</div>
                    <div className="text-[11px] font-medium text-red-600">Errors</div>
                  </div>
                </div>
                {(result.newDepartments > 0 || result.newCategories > 0) && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                    <Building2 className="h-3.5 w-3.5" />
                    Auto-created: {result.newDepartments} department{result.newDepartments === 1 ? "" : "s"}
                    {result.newDepartments > 0 && result.newCategories > 0 ? ", " : ""}
                    {result.newCategories > 0 && `${result.newCategories} categor${result.newCategories === 1 ? "y" : "ies"}`}
                  </p>
                )}
                {result.errors.length > 0 && (
                  <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-md border border-red-100 bg-white p-2 text-xs text-red-700">
                    {result.errors.map((e, i) => (
                      <p key={i}><span className="font-bold">Row {e.row}:</span> {e.message}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: column reference */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Columns for {mod.label}</CardTitle>
            <CardDescription className="text-xs">
              <span className="font-semibold text-red-500">* required.</span> Slug auto-generates from Title/Name if blank.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {mod.columns.map((c) => (
                <div key={c.key} className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/40">
                  <p className="flex items-center gap-2 text-xs font-bold">
                    {c.header}
                    {c.required ? (
                      <Badge variant="secondary" className="border-0 bg-red-100 px-1.5 py-0 text-[10px] text-red-700">required</Badge>
                    ) : (
                      <Badge variant="secondary" className="border-0 bg-gray-200/70 px-1.5 py-0 text-[10px] text-gray-500">optional</Badge>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-gray-500">{c.hint}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-teal-600/20 bg-teal-50/60 p-3 text-[11px] leading-relaxed text-teal-800 dark:bg-teal-500/10 dark:text-teal-200">
              {mod.id === "jobs" ? (
                <>State must already exist in the system - unknown states are left empty. Departments and categories are created automatically when missing.</>
              ) : mod.id === "categories" || mod.id === "departments" ? (
                <>Duplicate names or slugs are skipped. These are also auto-created when referenced by content uploads.</>
              ) : (
                <>Departments and categories are created automatically when missing, then each row is linked to them. Duplicate titles or slugs are skipped without changing existing records.</>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
