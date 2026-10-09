/**
 * Bulk upload module registry - single source of truth for:
 *  - Excel/CSV column headers per module
 *  - Template example rows
 *  - Server-side row mapping
 *
 * Header names match the admin form field labels so data lands
 * on the correct field of each module.
 */

export type BulkModuleId =
  | "jobs"
  | "results"
  | "admit-cards"
  | "admissions"
  | "syllabus"
  | "answer-keys"
  | "categories"
  | "departments"

export interface BulkColumn {
  /** Exact header text expected in the Excel/CSV file. */
  header: string
  /** Normalized key used in the parsed row object. */
  key: string
  required: boolean
  hint: string
}

export interface BulkModuleDef {
  id: BulkModuleId
  label: string
  description: string
  columns: BulkColumn[]
  /** Example values aligned 1:1 with `columns` (used in the template's sample row). */
  example: string[]
}

const COMMON_CONTENT_COLUMNS: BulkColumn[] = [
  { header: "Title", key: "title", required: true, hint: "Post title (must be unique)" },
  { header: "Slug", key: "slug", required: false, hint: "URL slug - auto-generated from Title if left blank" },
  { header: "Department", key: "department", required: true, hint: "Department name - created automatically if it doesn't exist" },
  { header: "Category", key: "category", required: true, hint: "Category name - created automatically if it doesn't exist" },
]

export const BULK_MODULES: BulkModuleDef[] = [
  {
    id: "jobs",
    label: "Gov Jobs",
    description: "Government job notifications",
    columns: [
      ...COMMON_CONTENT_COLUMNS,
      { header: "State", key: "state", required: false, hint: "State name (must already exist - left empty if unknown)" },
      { header: "Advertisement No", key: "advertisementNo", required: false, hint: "e.g. SSC/CGL/2026/01" },
      { header: "Total Vacancies", key: "totalVacancies", required: false, hint: "Number only, e.g. 7500" },
      { header: "Salary", key: "salary", required: false, hint: "e.g. Rs. 35,400 - 1,12,400/-" },
      { header: "Location", key: "location", required: false, hint: "e.g. Across India" },
      { header: "Age Limit", key: "ageLimit", required: false, hint: "e.g. 18-32 years" },
      { header: "Age Relaxation", key: "ageRelaxation", required: false, hint: "e.g. As per rules" },
      { header: "Education", key: "education", required: false, hint: "Qualification required" },
      { header: "Selection Process", key: "selectionProcess", required: false, hint: "e.g. Written Exam, Interview" },
      { header: "Application Fee", key: "applicationFee", required: false, hint: "e.g. Rs. 100 (General)" },
      { header: "Documents Required", key: "documentsRequired", required: false, hint: "List of documents" },
      { header: "How To Apply", key: "howToApply", required: false, hint: "Application instructions" },
      { header: "Official Notification", key: "officialNotification", required: false, hint: "Notification URL (https://...)" },
      { header: "Official Website", key: "officialWebsite", required: false, hint: "Website URL (https://...)" },
      { header: "Apply Link", key: "applyLink", required: false, hint: "Apply URL (https://...)" },
      { header: "Status", key: "status", required: false, hint: "ACTIVE, EXPIRED or UPCOMING (default ACTIVE)" },
      { header: "Experience", key: "experience", required: false, hint: "e.g. 0-2 years" },
      { header: "Start Date", key: "startDate", required: false, hint: "Date e.g. 2026-01-15" },
      { header: "Last Date", key: "lastDate", required: false, hint: "Date e.g. 2026-02-28" },
    ],
    example: [
      "SSC Combined Graduate Level Exam 2026", "ssc-cgl-2026", "Staff Selection Commission", "Central Government",
      "Karnataka", "SSC/CGL/2026/01", "7500", "Rs. 35,400 - 1,12,400/-", "Across India", "18-32 years", "As per rules",
      "Bachelor's Degree", "Tier I, Tier II, Document Verification", "Rs. 100 (General)", "Photo, Signature, Certificates",
      "Apply online through the official website", "https://ssc.gov.in/notification.pdf", "https://ssc.gov.in",
      "https://ssc.gov.in/apply", "ACTIVE", "0-2 years", "2026-01-15", "2026-02-28",
    ],
  },
  {
    id: "results",
    label: "Results",
    description: "Exam results",
    columns: [
      ...COMMON_CONTENT_COLUMNS,
      { header: "Description", key: "description", required: false, hint: "Details (plain text or HTML)" },
      { header: "PDF URL", key: "pdfUrl", required: false, hint: "Result PDF link (https://...)" },
      { header: "Result Date", key: "resultDate", required: false, hint: "Date e.g. 2026-03-10" },
      { header: "Status", key: "status", required: false, hint: "PUBLISHED to show live, else draft" },
    ],
    example: [
      "SSC CGL 2025 Tier I Result", "ssc-cgl-2025-tier1-result", "Staff Selection Commission", "Central Government",
      "SSC has declared the Tier I result. Check roll numbers in the PDF.", "https://ssc.gov.in/results/cgl-tier1.pdf",
      "2026-03-10", "PUBLISHED",
    ],
  },
  {
    id: "admit-cards",
    label: "Admit Cards",
    description: "Admit card releases and exam dates",
    columns: [
      ...COMMON_CONTENT_COLUMNS,
      { header: "Description", key: "description", required: false, hint: "Details (plain text or HTML)" },
      { header: "Download URL", key: "downloadUrl", required: false, hint: "Admit card download link (https://...)" },
      { header: "Exam Date", key: "examDate", required: false, hint: "Date e.g. 2026-04-20" },
      { header: "Status", key: "status", required: false, hint: "PUBLISHED to show live, else draft" },
    ],
    example: [
      "SSC CHSL 2026 Tier I Admit Card", "ssc-chsl-2026-admit-card", "Staff Selection Commission", "Central Government",
      "Download admit card using registration number and date of birth.", "https://ssc.gov.in/admitcards/chsl.pdf",
      "2026-04-20", "PUBLISHED",
    ],
  },
  {
    id: "admissions",
    label: "Admissions",
    description: "Admission notifications and applications",
    columns: [
      ...COMMON_CONTENT_COLUMNS,
      { header: "Description", key: "description", required: false, hint: "Details (plain text or HTML)" },
      { header: "Application Fee", key: "applicationFee", required: false, hint: "e.g. Rs. 750 (General)" },
      { header: "Start Date", key: "startDate", required: false, hint: "Date e.g. 2026-05-01" },
      { header: "Last Date", key: "lastDate", required: false, hint: "Date e.g. 2026-06-15" },
      { header: "PDF URL", key: "pdfUrl", required: false, hint: "Notification PDF link (https://...)" },
      { header: "Status", key: "status", required: false, hint: "PUBLISHED to show live, else draft" },
    ],
    example: [
      "IGNOU June 2026 Admission Open", "ignou-june-2026-admission", "Staff Selection Commission", "Teaching",
      "Admissions open for June 2026 session across programmes.", "Rs. 200 - 1000 depending on programme",
      "2026-05-01", "2026-06-15", "https://ignou.ac.in/admission.pdf", "PUBLISHED",
    ],
  },
  {
    id: "syllabus",
    label: "Syllabus",
    description: "Exam syllabus and patterns",
    columns: [
      ...COMMON_CONTENT_COLUMNS,
      { header: "Description", key: "description", required: false, hint: "Details (plain text or HTML)" },
      { header: "Subjects", key: "subjects", required: false, hint: "Comma-separated subjects" },
      { header: "PDF URL", key: "pdfUrl", required: false, hint: "Syllabus PDF link (https://...)" },
      { header: "Status", key: "status", required: false, hint: "PUBLISHED to show live, else draft" },
    ],
    example: [
      "SSC CGL Syllabus 2026", "ssc-cgl-syllabus-2026", "Staff Selection Commission", "Central Government",
      "Tier I and Tier II syllabus with exam pattern.", "General Intelligence, General Awareness, Quantitative Aptitude, English",
      "https://ssc.gov.in/syllabus/cgl.pdf", "PUBLISHED",
    ],
  },
  {
    id: "answer-keys",
    label: "Answer Keys",
    description: "Exam answer keys and solutions",
    columns: [
      ...COMMON_CONTENT_COLUMNS,
      { header: "Description", key: "description", required: false, hint: "Details (plain text or HTML)" },
      { header: "PDF URL", key: "pdfUrl", required: false, hint: "Answer key PDF link (https://...)" },
      { header: "Status", key: "status", required: false, hint: "PUBLISHED to show live, else draft" },
    ],
    example: [
      "SSC CPO 2025 Paper I Answer Key", "ssc-cpo-2025-answer-key", "Staff Selection Commission", "Central Government",
      "Provisional answer key with objection instructions.", "https://ssc.gov.in/answerkeys/cpo.pdf", "PUBLISHED",
    ],
  },
  {
    id: "categories",
    label: "Categories",
    description: "Job categories",
    columns: [
      { header: "Name", key: "name", required: true, hint: "Category name (must be unique)" },
      { header: "Slug", key: "slug", required: false, hint: "URL slug - auto-generated from Name if left blank" },
      { header: "Description", key: "description", required: false, hint: "Short description" },
    ],
    example: ["Banking", "banking", "Banking Jobs in India"],
  },
  {
    id: "departments",
    label: "Departments",
    description: "Departments / organisations",
    columns: [
      { header: "Name", key: "name", required: true, hint: "Department name (must be unique)" },
      { header: "Slug", key: "slug", required: false, hint: "URL slug - auto-generated from Name if left blank" },
      { header: "Description", key: "description", required: false, hint: "Short description" },
    ],
    example: ["Staff Selection Commission", "staff-selection-commission", "SSC - Conducts CGL, CHSL, MTS exams"],
  },
]

export const BULK_MODULE_MAP: Record<BulkModuleId, BulkModuleDef> = Object.fromEntries(
  BULK_MODULES.map((m) => [m.id, m])
) as Record<BulkModuleId, BulkModuleDef>

export function isBulkModuleId(v: unknown): v is BulkModuleId {
  return typeof v === "string" && (BULK_MODULES as BulkModuleDef[]).some((m) => m.id === v)
}

/** Max rows accepted per upload - protects the server from oversized files. */
export const BULK_MAX_ROWS = 500
