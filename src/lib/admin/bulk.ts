import { ADMIN_MODULES, type BulkAction } from "./permissions";

export interface BulkRequest {
  module: string;
  ids: string[];
  action: BulkAction;
  note?: string;
  data?: Record<string, unknown>;
}

export function bulkEndpoint() {
  return "/api/admin/bulk";
}

export function cloneEndpoint() {
  return "/api/admin/clone";
}

export function moduleKeys() {
  return ADMIN_MODULES.map((m) => m.key);
}

/** Client helper: run a bulk action with progress + partial failure handling. */
export async function runBulk(
  api: { post: <T>(url: string, body?: unknown) => Promise<T> },
  req: BulkRequest
) {
  // Chunk large selections to keep transactions small (SaaS bulk safety).
  const CHUNK = 50;
  const results: { ok: number; failed: number; errors: string[] } = { ok: 0, failed: 0, errors: [] };
  for (let i = 0; i < req.ids.length; i += CHUNK) {
    const chunk = req.ids.slice(i, i + CHUNK);
    try {
      const res = (await api.post<{ success: boolean; data?: { updated?: number; deleted?: number } }>(bulkEndpoint(), {
        ...req,
        ids: chunk,
      })) as unknown as { success: boolean; data?: { updated?: number; deleted?: number } };
      const n = res?.data?.updated ?? res?.data?.deleted ?? chunk.length;
      results.ok += n;
    } catch (e) {
      results.failed += chunk.length;
      results.errors.push(e instanceof Error ? e.message : "Bulk chunk failed");
    }
  }
  return results;
}

/** CSV template headers per module for ImportWizard. */
export const IMPORT_TEMPLATES: Record<string, string[]> = {
  Job: ["title", "slug", "departmentId", "categoryId", "stateId", "advertisementNo", "totalVacancies", "lastDate", "status"],
  Result: ["title", "slug", "departmentId", "categoryId", "jobId", "pdfUrl", "resultDate", "status"],
  AdmitCard: ["title", "slug", "departmentId", "categoryId", "jobId", "examDate", "downloadUrl", "status"],
  AnswerKey: ["title", "slug", "departmentId", "categoryId", "jobId", "pdfUrl", "status"],
  Admission: ["title", "slug", "departmentId", "categoryId", "startDate", "lastDate", "applicationFee", "pdfUrl", "status"],
  Syllabus: ["title", "slug", "departmentId", "categoryId", "jobId", "pdfUrl", "subjects", "status"],
};

export function templateCsv(module: string) {
  const headers = IMPORT_TEMPLATES[module] ?? ["title", "slug"];
  return headers.join(",") + "\n";
}
