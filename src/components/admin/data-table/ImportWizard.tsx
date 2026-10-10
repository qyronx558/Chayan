"use client";

import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { IMPORT_TEMPLATES, templateCsv } from "@/lib/admin/bulk";
import {
  normalizeHeader,
  normalizeJobStatus,
  parseImportDate,
  parseVacancies,
  buildRefLookup,
  resolveRefId,
  type RefLookup,
} from "@/lib/admin/import-normalize";
import {
  jobSchema,
  resultSchema,
  admitCardSchema,
  answerKeySchema,
  admissionSchema,
  syllabusSchema,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { UploadCloud, Download, AlertTriangle, CheckCircle2, FileWarning } from "lucide-react";

interface ImportWizardProps {
  open: boolean;
  onClose: () => void;
  module: string;
  endpoint: string;
  queryKey: string;
  extraDefaults?: Record<string, unknown>;
}

interface NormalizedRow {
  data: Record<string, unknown>;
  title: string;
  slug: string;
  error?: string;
  warning?: string;
}

interface FailedRow {
  title: string;
  slug: string;
  error: string;
}

const SCHEMAS: Record<
  string,
  | typeof jobSchema
  | typeof resultSchema
  | typeof admitCardSchema
  | typeof answerKeySchema
  | typeof admissionSchema
  | typeof syllabusSchema
> = {
  Job: jobSchema,
  Result: resultSchema,
  AdmitCard: admitCardSchema,
  AnswerKey: answerKeySchema,
  Admission: admissionSchema,
  Syllabus: syllabusSchema,
};

const DATE_KEYS = new Set(["startDate", "lastDate", "resultDate", "examDate"]);
const NULLABLE_TEXT_KEYS = new Set([
  "advertisementNo", "salary", "location", "ageLimit", "ageRelaxation",
  "education", "selectionProcess", "applicationFee", "documentsRequired",
  "howToApply", "officialNotification", "officialWebsite", "applyLink",
  "experience", "description", "pdfUrl", "downloadUrl", "subjects", "status",
]);

/** Coerce a cell to nullable text (Excel numbers/booleans become strings). */
function toNullableText(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t === "" || /^n\/?a$|^-+$|^nil$/i.test(t) ? null : t;
  }
  return String(v);
}

/** Minimal CSV parser (quoted fields supported) - no extra dep needed. */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === "," && !inQ) {
        out.push(cur.trim());
        cur = "";
      } else cur += c;
    }
    out.push(cur.trim());
    return out;
  };
  const headers = split(lines[0]).map((h) => h.replace(/^"|"$/g, ""));
  return lines.slice(1).map((l) => {
    const cells = split(l);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cells[i] ?? "").replace(/^"|"$/g, ""); });
    return row;
  });
}

interface LookupSets {
  dept: RefLookup;
  cat: RefLookup;
  state: RefLookup;
  jobs: RefLookup;
}

async function fetchLookups(module: string, jobRefs: string[]): Promise<LookupSets> {
  const get = async (url: string) => {
    try {
      const res = await api.get<{ success: boolean; data: { id: string; name?: string | null; slug?: string | null; title?: string | null }[] }>(url);
      return Array.isArray(res?.data) ? res.data : [];
    } catch {
      return [];
    }
  };
  const [depts, cats, states] = await Promise.all([
    get("/api/departments"),
    get("/api/categories"),
    get("/api/states"),
  ]);
  // Resolve linked-job refs (name/slug/id) with one small search per distinct value.
  const jobItems: { id: string; name?: string | null; slug?: string | null; title?: string | null }[] = [];
  const needsJobs = ["Result", "AdmitCard", "AnswerKey", "Syllabus"].includes(module);
  if (needsJobs) {
    for (const ref of jobRefs.slice(0, 100)) {
      try {
        const res = await api.get<{ success: boolean; data: { id: string; title: string; slug: string }[] }>(
          `/api/jobs?search=${encodeURIComponent(ref)}&limit=5`
        );
        if (Array.isArray(res?.data)) {
          for (const j of res.data) jobItems.push({ id: j.id, slug: j.slug, title: j.title });
        }
      } catch {
        /* ignore - unresolved refs warn per-row */
      }
    }
  }
  return {
    dept: buildRefLookup(depts),
    cat: buildRefLookup(cats),
    state: buildRefLookup(states),
    jobs: buildRefLookup(jobItems),
  };
}

export function ImportWizard({ open, onClose, module, endpoint, queryKey, extraDefaults }: ImportWizardProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<NormalizedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [resolving, setResolving] = useState(false);
  const [failed, setFailed] = useState<FailedRow[]>([]);
  const [imported, setImported] = useState(0);

  const headers = useMemo(() => IMPORT_TEMPLATES[module] ?? ["title", "slug"], [module]);
  const schema = SCHEMAS[module];

  const downloadTemplate = () => {
    const blob = new Blob([templateCsv(module)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module.toLowerCase()}-import-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadErrors = () => {
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = ["title,slug,error", ...failed.map((f) => [f.title, f.slug, f.error].map(esc).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module.toLowerCase()}-import-errors.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setRows([]);
    setFailed([]);
    setImported(0);
    setFileName("");
    setStep("upload");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (f: File) => {
    setFileName(f.name);
    setResolving(true);
    try {
      let parsed: Record<string, unknown>[];
      if (f.name.endsWith(".xlsx") || f.name.endsWith(".xls")) {
        try {
          const XLSX = await import("xlsx");
          const buf = await f.arrayBuffer();
          const wb = XLSX.read(buf, { cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" }).map((r) => {
            const o: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(r)) {
              // Preserve native types: Dates stay Dates, numbers stay numbers -
              // the normalizer below handles each type explicitly.
              o[String(k).trim()] = typeof v === "string" ? v.trim() : v;
            }
            return o;
          });
        } catch {
          toast("Could not parse Excel file", "destructive");
          setResolving(false);
          return;
        }
      } else {
        parsed = parseCsv(await f.text());
      }

      if (parsed.length === 0) {
        toast("No data rows found in file", "destructive");
        setResolving(false);
        return;
      }

      // 1. Map raw headers → canonical keys via aliases; drop unknown columns.
      const aliased: Record<string, unknown>[] = parsed.slice(0, 500).map((r) => {
        const o: Record<string, unknown> = {};
        for (const [h, v] of Object.entries(r)) {
          const key = normalizeHeader(h);
          if (key && !(key in o)) o[key] = v;
        }
        return o;
      });

      // 2. Fetch name→ID lookups (departments, categories, states + linked jobs).
      const jobRefs = [...new Set(
        aliased.map((r) => String(r.jobId ?? "").trim()).filter((s) => s !== "")
      )];
      const lookups = await fetchLookups(module, jobRefs);

      // 3. Normalize each row the same way the server expects it.
      const seenSlugs = new Set<string>();
      const normalized: NormalizedRow[] = aliased.map((raw, idx) => {
        const warnings: string[] = [];
        const data: Record<string, unknown> = { ...extraDefaults };

        const title = String(raw.title ?? "").trim();
        let slug = String(raw.slug ?? "").trim();
        if (!slug && title) slug = slugify(title);
        if (!slug) slug = `import-${Date.now()}-${idx + 1}`;

        // Foreign keys: accept ID, name, or slug.
        const deptId = resolveRefId(raw.departmentId, lookups.dept);
        if (raw.departmentId !== undefined && String(raw.departmentId).trim() !== "" && !deptId) {
          warnings.push(`Department "${String(raw.departmentId).trim()}" not found`);
        }
        const catId = resolveRefId(raw.categoryId, lookups.cat);
        if (raw.categoryId !== undefined && String(raw.categoryId).trim() !== "" && !catId) {
          warnings.push(`Category "${String(raw.categoryId).trim()}" not found`);
        }
        const stateRaw = raw.stateId;
        const stateId = stateRaw === undefined || String(stateRaw).trim() === "" ? null : resolveRefId(stateRaw, lookups.state);
        if (stateRaw !== undefined && String(stateRaw).trim() !== "" && !stateId) {
          warnings.push(`State "${String(stateRaw).trim()}" not found - cleared`);
        }
        const jobRaw = raw.jobId;
        const jobId = jobRaw === undefined || String(jobRaw).trim() === "" ? null : resolveRefId(jobRaw, lookups.jobs);
        if (jobRaw !== undefined && String(jobRaw).trim() !== "" && !jobId) {
          warnings.push(`Linked job "${String(jobRaw).trim()}" not found - link cleared`);
        }

        data.title = title;
        data.slug = slug;
        data.departmentId = deptId;
        data.categoryId = catId;
        if ("stateId" in raw || stateId) data.stateId = stateId;
        if ("jobId" in raw || jobId) data.jobId = jobId;

        // Status: human text → enum (Job) or trimmed text (others).
        if (module === "Job") {
          const st = normalizeJobStatus(raw.status);
          if (st) data.status = st;
          else if (raw.status !== undefined && String(raw.status).trim() !== "") {
            warnings.push(`Status "${String(raw.status).trim()}" not recognized - using ACTIVE`);
          }
        } else if (raw.status !== undefined) {
          const s = String(raw.status).trim();
          data.status = s === "" ? null : s;
        }

        if (raw.totalVacancies !== undefined) data.totalVacancies = parseVacancies(raw.totalVacancies);
        for (const k of DATE_KEYS) {
          if (raw[k] !== undefined) data[k] = parseImportDate(raw[k]);
        }
        for (const k of NULLABLE_TEXT_KEYS) {
          if (k === "status") continue;
          if (raw[k] !== undefined) data[k] = toNullableText(raw[k]);
        }
        // Any other scalar passes through trimmed (numbers/booleans stringified).
        for (const [k, v] of Object.entries(raw)) {
          if (k in data) continue;
          if (v === null || v === undefined) data[k] = null;
          else if (typeof v === "string") data[k] = v.trim() === "" ? null : v.trim();
          else data[k] = String(v);
        }

        // Duplicate slugs inside the file would 409 on the server - flag early.
        let error: string | undefined;
        if (!title) error = "Title is required";
        else if (seenSlugs.has(slug)) error = `Duplicate slug "${slug}" in this file`;
        else {
          seenSlugs.add(slug);
          if (schema) {
            const check = schema.safeParse(data);
            if (!check.success) error = check.error.issues[0]?.message ?? "Invalid row";
          }
        }

        return { data, title: title || `(row ${idx + 1})`, slug, error, warning: warnings.length ? warnings.join("; ") : undefined };
      });

      setRows(normalized);
      setStep("preview");
    } finally {
      setResolving(false);
    }
  };

  const validRows = rows.filter((r) => !r.error);
  const errorRows = rows.filter((r) => r.error);

  const mutation = useMutation({
    mutationFn: async () => {
      let ok = 0;
      const fails: FailedRow[] = [];
      for (const r of validRows) {
        try {
          await api.post(endpoint, r.data);
          ok++;
        } catch (e) {
          fails.push({ title: r.title, slug: r.slug, error: e instanceof Error ? e.message : "failed" });
        }
      }
      return { ok, fails };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setImported(res.ok);
      setFailed(res.fails);
      setStep("result");
      if (res.fails.length === 0) toast(`Imported ${res.ok} ${module} rows`, "success");
    },
    onError: (e: unknown) => toast(e instanceof Error ? e.message : "Import failed", "destructive"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5" /> Bulk import - {module}
          </DialogTitle>
          <DialogDescription>
            Upload CSV or Excel (max 500 rows). Department, category, state and linked-job columns accept{" "}
            <span className="font-semibold">names or IDs</span>; status accepts Active / Expired / Upcoming
            (also Published / Draft / Closed). Rows are validated before import - employees import as PENDING,
            super admins as APPROVED.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download CSV template
              </Button>
              <span className="text-xs text-slate-500">Columns: {headers.join(", ")}</span>
            </div>
            <div>
              <Label>Choose file (.csv, .xlsx)</Label>
              <Input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                disabled={resolving}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              {resolving && <p className="mt-2 text-xs text-slate-500">Reading file, resolving names…</p>}
            </div>
          </div>
        ) : step === "preview" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">{fileName}</Badge>
              <Badge className="bg-green-600 text-white">
                <CheckCircle2 className="mr-1 h-3 w-3" /> {validRows.length} ready
              </Badge>
              {errorRows.length > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 h-3 w-3" /> {errorRows.length} blocked
                </Badge>
              )}
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => { setStep("upload"); setRows([]); }}>
                  Re-upload
                </Button>
                <Button type="button" size="sm" disabled={validRows.length === 0 || mutation.isPending} onClick={() => mutation.mutate()}>
                  {mutation.isPending ? "Importing…" : `Import ${validRows.length} rows`}
                </Button>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Blocked rows are skipped automatically. Warnings (unrecognized department, cleared job link…) don&apos;t block import.
            </p>
            <div className="max-h-80 overflow-auto rounded-lg border text-xs">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-2 py-1.5 text-left">#</th>
                    <th className="px-2 py-1.5 text-left">title</th>
                    <th className="px-2 py-1.5 text-left">slug</th>
                    <th className="px-2 py-1.5 text-left">validation</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((r, i) => (
                    <tr key={i} className={r.error ? "bg-red-50 dark:bg-red-950/30" : r.warning ? "bg-amber-50 dark:bg-amber-950/20" : undefined}>
                      <td className="px-2 py-1">{i + 1}</td>
                      <td className="px-2 py-1">{r.title}</td>
                      <td className="px-2 py-1 font-mono">{r.slug}</td>
                      <td className="px-2 py-1">
                        {r.error ? (
                          <span className="text-red-600">{r.error}</span>
                        ) : r.warning ? (
                          <span className="text-amber-700 dark:text-amber-300">ready · {r.warning}</span>
                        ) : (
                          "ready"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 100 && <p className="px-2 py-1.5 text-slate-500">Showing first 100 of {rows.length}…</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge className="bg-green-600 text-white">
                <CheckCircle2 className="mr-1 h-3 w-3" /> {imported} imported
              </Badge>
              {failed.length > 0 && (
                <Badge variant="destructive">
                  <FileWarning className="mr-1 h-3 w-3" /> {failed.length} failed
                </Badge>
              )}
              <div className="ml-auto flex gap-2">
                {failed.length > 0 && (
                  <Button type="button" variant="outline" size="sm" onClick={downloadErrors}>
                    <Download className="mr-1 h-3.5 w-3.5" /> Error report
                  </Button>
                )}
                <Button type="button" size="sm" onClick={handleClose}>Done</Button>
              </div>
            </div>
            {failed.length > 0 ? (
              <div className="max-h-80 overflow-auto rounded-lg border text-xs">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-2 py-1.5 text-left">title</th>
                      <th className="px-2 py-1.5 text-left">slug</th>
                      <th className="px-2 py-1.5 text-left">error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failed.map((f, i) => (
                      <tr key={i} className="bg-red-50 dark:bg-red-950/30">
                        <td className="px-2 py-1">{f.title}</td>
                        <td className="px-2 py-1 font-mono">{f.slug}</td>
                        <td className="px-2 py-1 text-red-600">{f.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                All rows imported successfully and are now visible in the list.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
