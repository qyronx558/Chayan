export type StaffRole = "ADMIN" | "SUPER_ADMIN";

export type ListModuleKey =
  | "Job"
  | "PrivateJob"
  | "Result"
  | "AdmitCard"
  | "AnswerKey"
  | "Admission"
  | "Syllabus"
  | "Blog";

export type ListAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "verify"
  | "reject"
  | "submit"
  | "import"
  | "export"
  | "audit"
  | "filterByUploader";

export type ListTab = "all" | "published" | "needs" | "draft" | "rejected";

export const LIST_TABS: readonly { key: ListTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "needs", label: "Needs review" },
  { key: "draft", label: "Draft" },
  { key: "rejected", label: "Rejected" },
];

const ADMIN_ACTIONS: readonly ListAction[] = ["view", "create", "edit", "submit", "import", "export"];

const SUPER_ACTIONS: readonly ListAction[] = [
  ...ADMIN_ACTIONS,
  "delete",
  "verify",
  "reject",
  "audit",
  "filterByUploader",
];

function fullMap(actions: readonly ListAction[]): Record<ListModuleKey, readonly ListAction[]> {
  return {
    Job: actions,
    PrivateJob: actions,
    Result: actions,
    AdmitCard: actions,
    AnswerKey: actions,
    Admission: actions,
    Syllabus: actions,
    Blog: actions,
  };
}

export const LIST_PERMISSIONS: Record<StaffRole, Record<ListModuleKey, readonly ListAction[]>> = {
  ADMIN: fullMap(ADMIN_ACTIONS),
  SUPER_ADMIN: fullMap(SUPER_ACTIONS),
};

export function staffRole(role?: string | null): StaffRole | null {
  return role === "ADMIN" || role === "SUPER_ADMIN" ? role : null;
}

export function can(role: string | null | undefined, module: ListModuleKey, action: ListAction): boolean {
  const r = staffRole(role);
  if (!r) return false;
  return LIST_PERMISSIONS[r][module].includes(action);
}

export type ForbiddenError = Error & { status: 403 };

export function forbidden(message = "Forbidden"): ForbiddenError {
  const err = new Error(message) as ForbiddenError;
  err.status = 403;
  return err;
}

export function requireAction(
  role: string | null | undefined,
  module: ListModuleKey,
  action: ListAction
): asserts role is StaffRole {
  if (!can(role, module, action)) throw forbidden();
}

export function ownerFilter(role: StaffRole, userId: string): { createdById?: string } {
  return role === "ADMIN" ? { createdById: userId } : {};
}

export function isListTab(value: unknown): value is ListTab {
  return value === "all" || value === "published" || value === "needs" || value === "draft" || value === "rejected";
}
