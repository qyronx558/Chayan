/** Shared CSV/Excel normalization for the admin bulk-import wizard. */

const HEADER_ALIASES: Record<string, string> = {
  title: "title",
  name: "title",
  posttitle: "title",
  jobtitle: "title",
  slug: "slug",
  urlslug: "slug",
  departmentid: "departmentId",
  department: "departmentId",
  dept: "departmentId",
  departmentname: "departmentId",
  organisation: "departmentId",
  organization: "departmentId",
  categoryid: "categoryId",
  category: "categoryId",
  categoryname: "categoryId",
  stateid: "stateId",
  state: "stateId",
  statename: "stateId",
  jobid: "jobId",
  job: "jobId",
  linkedjob: "jobId",
  jobtitle2: "jobId",
  relatedjob: "jobId",
  advertisementno: "advertisementNo",
  advtno: "advertisementNo",
  notificationno: "advertisementNo",
  totalvacancies: "totalVacancies",
  vacancies: "totalVacancies",
  totalvacancy: "totalVacancies",
  noofposts: "totalVacancies",
  posts: "totalVacancies",
  vacancy: "totalVacancies",
  salary: "salary",
  payscale: "salary",
  pay: "salary",
  location: "location",
  place: "location",
  joblocation: "location",
  agelimit: "ageLimit",
  age: "ageLimit",
  agerelaxation: "ageRelaxation",
  relaxation: "ageRelaxation",
  education: "education",
  qualification: "education",
  eligibility: "education",
  selectionprocess: "selectionProcess",
  selection: "selectionProcess",
  applicationfee: "applicationFee",
  fee: "applicationFee",
  fees: "applicationFee",
  importantdates: "importantDates",
  dates: "importantDates",
  documentsrequired: "documentsRequired",
  documents: "documentsRequired",
  howtoapply: "howToApply",
  officialnotification: "officialNotification",
  notificationlink: "officialNotification",
  notificationurl: "officialNotification",
  officialwebsite: "officialWebsite",
  website: "officialWebsite",
  applylink: "applyLink",
  applyonline: "applyLink",
  applyurl: "applyLink",
  status: "status",
  experience: "experience",
  exp: "experience",
  startdate: "startDate",
  applicationstart: "startDate",
  openingdate: "startDate",
  lastdate: "lastDate",
  closingdate: "lastDate",
  deadline: "lastDate",
  applyby: "lastDate",
  description: "description",
  details: "description",
  content: "description",
  pdfurl: "pdfUrl",
  pdf: "pdfUrl",
  pdflink: "pdfUrl",
  resultdate: "resultDate",
  declaredon: "resultDate",
  examdate: "examDate",
  downloadurl: "downloadUrl",
  downloadlink: "downloadUrl",
  hallticket: "downloadUrl",
  subjects: "subjects",
  topics: "subjects",
};

/** Normalize a raw file header to a canonical field key (or null if unknown). */
export function normalizeHeader(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!key) return null;
  return HEADER_ALIASES[key] ?? null;
}

/** Map human status text to the Job enum. Unknown/empty → undefined (schema default ACTIVE). */
export function normalizeJobStatus(v: unknown): "ACTIVE" | "EXPIRED" | "UPCOMING" | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim().toUpperCase().replace(/[\s_-]+/g, "_");
  if (!s || s === "NULL" || s === "N/A") return undefined;
  if (["ACTIVE", "PUBLISHED", "PUBLISH", "LIVE", "OPEN"].includes(s)) return "ACTIVE";
  if (["EXPIRED", "CLOSED", "END", "ENDED", "OVER"].includes(s)) return "EXPIRED";
  if (["UPCOMING", "DRAFT", "PENDING", "SCHEDULED", "SOON", "COMING_SOON"].includes(s)) return "UPCOMING";
  return undefined;
}

/** Empty-ish strings become null so zod nullable/optional fields pass. */
export function emptyToNull(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "" || /^n\/?a$|^-+$|^nil$/i.test(t)) return null;
    return t;
  }
  return v;
}

const PLACEHOLDER_DATE = /^(tba|tbd|to be (announced|updated|notified)|will be updated|notified soon|announced soon|soon|tentative|-+)$/i;

/** Parse human dates ("03 Aug 2026", ISO, "Aug 3, 2026"). Placeholders/garbage → null. */
export function parseImportDate(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString();
  const s = String(v).trim();
  if (!s) return null;
  if (PLACEHOLDER_DATE.test(s) || PLACEHOLDER_DATE.test(s.split(":")[0])) return null;
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

/** Extract a positive integer ("1,200 posts" → 1200). None/non-positive → null. */
export function parseVacancies(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") {
    return Number.isFinite(v) && v > 0 ? Math.trunc(v) : null;
  }
  const s = String(v).replace(/,/g, "");
  const m = s.match(/-?\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return n > 0 ? n : null;
}

export interface RefLookup {
  byId: Map<string, string>;
  byName: Map<string, string>;
}

export function buildRefLookup(items: { id: string; name?: string | null; slug?: string | null; title?: string | null }[]): RefLookup {
  const byId = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const it of items) {
    byId.set(it.id, it.id);
    const names = [it.name, it.slug, (it as { title?: string | null }).title];
    for (const n of names) {
      if (n && !byName.has(n.trim().toLowerCase())) byName.set(n.trim().toLowerCase(), it.id);
    }
  }
  return { byId, byName };
}

/** Resolve a cell that may hold an ID, name, or slug → canonical ID, or null. */
export function resolveRefId(raw: unknown, lookup: RefLookup): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (lookup.byId.has(s)) return s;
  return lookup.byName.get(s.toLowerCase()) ?? null;
}
