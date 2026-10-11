import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type {
  AuditAction,
  AuditAlertRuleView,
  AuditChannelView,
  AuditDayBucket,
  AuditEventView,
  AuditInsights,
  AuditPattern,
  AuditSource,
  ExportScheduleState,
  IntegrityState,
  RetentionState,
} from "@/components/admin/audit/types";
import { isSensitiveAction } from "@/components/admin/audit/types";

type AnyClient = Record<string, unknown> & {
  auditEvent?: {
    findMany: (a: unknown) => Promise<unknown[]>;
    findFirst: (a: unknown) => Promise<unknown | null>;
    count: (a: unknown) => Promise<number>;
    create: (a: unknown) => Promise<unknown>;
    update: (a: unknown) => Promise<unknown>;
    deleteMany: (a: unknown) => Promise<{ count: number }>;
    groupBy?: (a: unknown) => Promise<unknown[]>;
  };
  log?: {
    findMany: (a: unknown) => Promise<unknown[]>;
    count: (a: unknown) => Promise<number>;
    create: (a: unknown) => Promise<unknown>;
    deleteMany: (a: unknown) => Promise<{ count: number }>;
  };
  retentionPolicy?: { findFirst: (a: unknown) => Promise<unknown | null>; create: (a: unknown) => Promise<unknown>; update: (a: unknown) => Promise<unknown> };
  exportSchedule?: { findFirst: (a: unknown) => Promise<unknown | null>; create: (a: unknown) => Promise<unknown>; update: (a: unknown) => Promise<unknown> };
  auditAlertRule?: { findMany: (a: unknown) => Promise<unknown[]>; create: (a: unknown) => Promise<unknown>; update: (a: unknown) => Promise<unknown> };
  auditChannel?: { findMany: (a: unknown) => Promise<unknown[]>; upsert: (a: unknown) => Promise<unknown> };
  logArchive?: { findMany: (a: unknown) => Promise<unknown[]>; create: (a: unknown) => Promise<unknown>; count: (a: unknown) => Promise<number> };
  integrationSetting?: { findUnique: (a: unknown) => Promise<unknown | null>; upsert: (a: unknown) => Promise<unknown> };
  user?: { findMany: (a: unknown) => Promise<unknown[]>; findUnique: (a: unknown) => Promise<unknown | null>; update: (a: unknown) => Promise<unknown> };
};

function db(): AnyClient {
  return prisma as unknown as AnyClient;
}

function missingTable(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const msg = err instanceof Error ? err.message : String(err);
  return code === "P2021" || code === "P2022" || /does not exist|no such table/i.test(msg);
}

export function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function canonicalEventJson(e: {
  action: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  actorRole: string | null;
  summary: string;
  diff: unknown;
  source: string;
  createdAt: string;
}): string {
  return stableStringify(e);
}

export function computeHash(prevHash: string, canonical: string): string {
  return sha256Hex(`${prevHash}${canonical}`);
}

interface LegacyLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string | null;
  details: string | null;
  createdAt: Date | string;
  user?: { id: string; name: string | null; email: string } | null;
}

function asAuditAction(raw: string): AuditAction {
  const v = raw.toUpperCase().replace(/[\s-]+/g, "_");
  const known: AuditAction[] = ["CREATE", "BULK_CREATE", "UPDATE", "APPROVE", "BULK_APPROVE", "REJECT", "DELETE", "BULK_DELETE", "ROLE_CHANGE", "LOG_PURGE"];
  if ((known as string[]).includes(v)) return v as AuditAction;
  if (v === "STATUS") return "UPDATE";
  if (v === "LOGIN" || v === "LOGOUT" || v === "VIEW" || v === "IMPORT") return "CREATE";
  return "UPDATE";
}

function summarize(action: AuditAction, entityType: string, details: string | null, actorName: string): string {
  const clean = (details ?? "").replace(/\s*-\s*by\s+\S+\s+\(\w+\)\s*$/, "").trim();
  if (clean) return clean.length > 160 ? `${clean.slice(0, 157)}…` : clean;
  const label: Record<AuditAction, string> = {
    CREATE: "created",
    BULK_CREATE: "bulk created",
    UPDATE: "updated",
    APPROVE: "approved",
    BULK_APPROVE: "bulk approved",
    REJECT: "rejected",
    DELETE: "deleted",
    BULK_DELETE: "bulk deleted",
    ROLE_CHANGE: "changed the role for",
    LOG_PURGE: "purged logs for",
  };
  return `${actorName} ${label[action]} ${entityType}`;
}

export function mapLegacyLog(log: LegacyLog): AuditEventView {
  const action = asAuditAction(log.action);
  const actorName = log.user?.name || log.user?.email || "System";
  return {
    id: log.id,
    createdAt: new Date(log.createdAt).toISOString(),
    action,
    entityType: log.entity || "Log",
    entityId: log.entityId || "-",
    actorId: log.userId,
    actorRole: null,
    actor: log.user ? { id: log.user.id, name: log.user.name, email: log.user.email } : null,
    summary: summarize(action, log.entity || "Log", log.details, actorName),
    diff: null,
    source: /bulk|import/i.test(log.details ?? "") ? "BULK_IMPORT" : "ADMIN_UI",
    ipAddress: null,
    userAgent: null,
    requestId: null,
    flagged: false,
    reviewedAt: null,
    reviewedById: null,
    note: null,
    hash: null,
    sensitive: isSensitiveAction(action),
  };
}

type AuditRow = {
  id: string;
  createdAt: Date | string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  actorRole: string | null;
  summary: string;
  diff: unknown;
  source: string;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  flagged: boolean;
  reviewedAt: Date | string | null;
  reviewedById: string | null;
  note: string | null;
  hash: string | null;
  prevHash?: string | null;
  actor?: { id: string; name: string | null; email: string } | null;
};

export function mapAuditRow(row: AuditRow): AuditEventView {
  const action = asAuditAction(row.action);
  let diff: AuditEventView["diff"] = null;
  if (row.diff && typeof row.diff === "object") {
    const d = row.diff as Record<string, unknown>;
    const before = (d.before as Record<string, unknown> | null) ?? null;
    const after = (d.after as Record<string, unknown> | null) ?? null;
    if (before || after) diff = { before, after };
  }
  return {
    id: row.id,
    createdAt: new Date(row.createdAt).toISOString(),
    action,
    entityType: row.entityType,
    entityId: row.entityId,
    actorId: row.actorId,
    actorRole: row.actorRole,
    actor: row.actor ? { id: row.actor.id, name: row.actor.name, email: row.actor.email, role: row.actorRole } : row.actorId ? { id: row.actorId, name: null, email: null, role: row.actorRole } : null,
    summary: row.summary,
    diff,
    source: (row.source as AuditSource) ?? "ADMIN_UI",
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    requestId: row.requestId,
    flagged: row.flagged,
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt).toISOString() : null,
    reviewedById: row.reviewedById,
    note: row.note,
    hash: row.hash,
    sensitive: isSensitiveAction(action),
  };
}

export interface EventQuery {
  q: string;
  action: string;
  entity: string;
  actor: string;
  from: string;
  to: string;
  flaggedOnly?: boolean;
  needsReview?: boolean;
  sensitiveOnly?: boolean;
  page: number;
  limit: number;
  actorId?: string | null;
  forceMine?: boolean;
}

export async function auditTablesAvailable(): Promise<boolean> {
  try {
    await db().auditEvent?.count({ where: {} });
    return true;
  } catch (err) {
    if (missingTable(err)) return false;
    throw err;
  }
}

export async function fetchAuditEvents(query: EventQuery): Promise<{ events: AuditEventView[]; total: number }> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;
  if (await auditTablesAvailable()) {
    const where: Record<string, unknown> = {};
    if (query.forceMine && query.actorId) where.actorId = query.actorId;
    else if (query.actor) where.actorId = query.actor;
    if (query.action) where.action = query.action;
    if (query.entity) where.entityType = query.entity;
    if (query.flaggedOnly) where.flagged = true;
    if (query.sensitiveOnly) where.action = { in: ["ROLE_CHANGE", "DELETE", "BULK_DELETE", "LOG_PURGE"] };
    if (query.needsReview) where.AND = [{ OR: [{ flagged: true }, { reviewedAt: null, action: { in: ["ROLE_CHANGE", "DELETE", "BULK_DELETE", "LOG_PURGE"] } }] }];
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
        ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
      };
    }
    if (query.q) {
      where.OR = [
        { summary: { contains: query.q, mode: "insensitive" } },
        { entityId: { contains: query.q } },
        { entityType: { contains: query.q, mode: "insensitive" } },
        { note: { contains: query.q, mode: "insensitive" } },
        { requestId: { contains: query.q } },
        { actor: { email: { contains: query.q, mode: "insensitive" } } },
        { actor: { name: { contains: query.q, mode: "insensitive" } } },
      ];
    }
    const [rows, total] = await Promise.all([
      db().auditEvent!.findMany({ where, include: { actor: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" }, skip, take: limit }) as Promise<AuditRow[]>,
      db().auditEvent!.count({ where }),
    ]);
    return { events: rows.map(mapAuditRow), total };
  }
  const where: Record<string, unknown> = {};
  if (query.forceMine && query.actorId) where.userId = query.actorId;
  else if (query.actor) where.userId = query.actor;
  if (query.action) {
    const direct = query.action;
    where.action = direct === "BULK_DELETE" ? { in: ["DELETE", "BULK_DELETE"] } : direct;
  }
  if (query.entity) where.entity = query.entity;
  if (query.sensitiveOnly) where.action = { in: ["ROLE_CHANGE", "DELETE", "LOG_PURGE"] };
  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
      ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
    };
  }
  if (query.q) {
    where.OR = [
      { action: { contains: query.q, mode: "insensitive" } },
      { entity: { contains: query.q, mode: "insensitive" } },
      { entityId: { contains: query.q } },
      { details: { contains: query.q, mode: "insensitive" } },
      { user: { email: { contains: query.q, mode: "insensitive" } } },
      { user: { name: { contains: query.q, mode: "insensitive" } } },
    ];
  }
  const [rows, total] = await Promise.all([
    db().log!.findMany({ where, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" }, skip, take: limit }) as Promise<LegacyLog[]>,
    db().log!.count({ where }),
  ]);
  let events = rows.map(mapLegacyLog);
  if (query.flaggedOnly || query.needsReview) events = [];
  return { events, total };
}

export async function fetchAuditById(id: string): Promise<AuditEventView | null> {
  if (await auditTablesAvailable()) {
    const row = (await db().auditEvent!.findFirst({ where: { id }, include: { actor: { select: { id: true, name: true, email: true } } } })) as unknown as AuditRow | null;
    return row ? mapAuditRow(row) : null;
  }
  const rows = (await db().log!.findMany({ where: {}, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" }, skip: 0, take: 1 })) as LegacyLog[];
  void rows;
  return null;
}

export async function writeAuditEvent(input: {
  action: AuditAction;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  actorRole?: string | null;
  summary: string;
  diff?: { before?: Record<string, unknown> | null; after?: Record<string, unknown> | null } | null;
  source?: AuditSource;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}): Promise<void> {
  const createdAt = new Date();
  const source = input.source ?? "ADMIN_UI";
  try {
    if (await auditTablesAvailable()) {
      const last = (await db().auditEvent!.findFirst({ orderBy: { createdAt: "desc" } })) as unknown as { hash?: string | null } | null;
      const prevHash = last?.hash ?? "GENESIS";
      const canonical = canonicalEventJson({
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        summary: input.summary,
        diff: input.diff ?? null,
        source,
        createdAt: createdAt.toISOString(),
      });
      const hash = computeHash(prevHash, canonical);
      await db().auditEvent!.create({
        data: {
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          actorId: input.actorId ?? null,
          actorRole: input.actorRole ?? null,
          summary: input.summary.slice(0, 500),
          diff: input.diff ?? undefined,
          source,
          ipAddress: input.ipAddress ?? null,
          userAgent: (input.userAgent ?? "").slice(0, 500) || null,
          requestId: input.requestId ?? null,
          prevHash,
          hash,
        },
      });
      void evaluateAuditAlerts({ action: input.action, entityType: input.entityType, actorId: input.actorId ?? null, summary: input.summary }).catch(() => undefined);
      return;
    }
  } catch {
  }
  try {
    await db().log!.create({
      data: {
        action: input.action,
        entity: input.entityType,
        entityId: input.entityId,
        userId: input.actorId ?? undefined,
        details: `${input.summary} [${source}]`.slice(0, 2000),
      },
    });
  } catch {
  }
}

export async function verifyChain(sample = 2000): Promise<IntegrityState> {
  try {
    if (!(await auditTablesAvailable())) {
      const total = await db().log!.count({ where: {} }).catch(() => 0);
      return { ok: true, checked: total, lastVerifiedAt: new Date().toISOString(), firstMismatchId: null };
    }
    const rows = (await db().auditEvent!.findMany({ orderBy: { createdAt: "asc" }, take: sample })) as unknown as AuditRow[];
    let prev = "GENESIS";
    for (const row of rows) {
      const canonical = canonicalEventJson({
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        actorId: row.actorId,
        actorRole: row.actorRole,
        summary: row.summary,
        diff: (row.diff as unknown) ?? null,
        source: row.source,
        createdAt: new Date(row.createdAt).toISOString(),
      });
      const expected = computeHash(row.prevHash ?? prev, canonical);
      if ((row.prevHash ?? prev) !== prev || row.hash !== expected) {
        return { ok: false, checked: rows.length, lastVerifiedAt: new Date().toISOString(), firstMismatchId: row.id };
      }
      prev = row.hash ?? prev;
    }
    try {
      await db().integrationSetting?.upsert({
        where: { key: "audit:integrity" },
        create: { key: "audit:integrity", config: { lastVerifiedAt: new Date().toISOString(), checked: rows.length, ok: true } },
        update: { config: { lastVerifiedAt: new Date().toISOString(), checked: rows.length, ok: true } },
      });
    } catch {
    }
    return { ok: true, checked: rows.length, lastVerifiedAt: new Date().toISOString(), firstMismatchId: null };
  } catch {
    return { ok: true, checked: 0, lastVerifiedAt: null, firstMismatchId: null };
  }
}

export async function lastIntegrity(): Promise<IntegrityState> {
  try {
    const row = (await db().integrationSetting?.findUnique({ where: { key: "audit:integrity" } })) as unknown as { config?: { lastVerifiedAt?: string; checked?: number; ok?: boolean } } | null;
    const cfg = row?.config;
    if (cfg?.lastVerifiedAt) return { ok: cfg.ok !== false, checked: cfg.checked ?? 0, lastVerifiedAt: cfg.lastVerifiedAt, firstMismatchId: null };
  } catch {
  }
  return { ok: true, checked: 0, lastVerifiedAt: null, firstMismatchId: null };
}

export function rangeBounds(days: number): { start: Date; prevStart: Date; prevEnd: Date } {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const prevEnd = start;
  const prevStart = new Date(start.getTime() - days * 86400000);
  return { start, prevStart, prevEnd };
}

export async function computeKpis(days = 30): Promise<{ kpis: { key: string; label: string; value: number; deltaPct: number | null; sub: string; needsAction: boolean; reviewCount?: number }[]; total: number }> {
  const { start, prevStart, prevEnd } = rangeBounds(days);
  const useAudit = await auditTablesAvailable();
  async function count(where: Record<string, unknown>): Promise<number> {
    try {
      if (useAudit) return await db().auditEvent!.count({ where });
      const mapped: Record<string, unknown> = {};
      if (where.createdAt) mapped.createdAt = where.createdAt;
      if (where.action) mapped.action = where.action;
      return await db().log!.count({ where: mapped });
    } catch {
      return 0;
    }
  }
  const [total, prevTotal] = await Promise.all([
    count({ createdAt: { gte: start } }),
    count({ createdAt: { gte: prevStart, lt: prevEnd } }),
  ]);
  const [activeUsers, sensitive, failed] = await Promise.all([
    (async () => {
      try {
        if (useAudit) {
          const rows = (await db().auditEvent!.findMany({ where: { createdAt: { gte: start } }, select: { actorId: true } })) as unknown as { actorId: string | null }[];
          return new Set(rows.map((r) => r.actorId).filter(Boolean)).size;
        }
        const rows = (await db().log!.findMany({ where: { createdAt: { gte: start } } })) as unknown as { userId: string | null }[];
        return new Set(rows.map((r) => r.userId).filter(Boolean)).size;
      } catch {
        return 0;
      }
    })(),
    count({ createdAt: { gte: start }, action: { in: ["ROLE_CHANGE", "DELETE", "BULK_DELETE", "LOG_PURGE"] } }),
    count({ createdAt: { gte: start }, action: { in: ["REJECT"] } }),
  ]);
  let reviewCount = 0;
  try {
    if (useAudit) reviewCount = await db().auditEvent!.count({ where: { flagged: true, reviewedAt: null } });
  } catch {
    reviewCount = 0;
  }
  const pct = (c: number, p: number): number | null => (p === 0 ? null : Math.round(((c - p) / p) * 1000) / 10);
  return {
    total,
    kpis: [
      { key: "events", label: "Events", value: total, deltaPct: pct(total, prevTotal), sub: `Last ${days} days`, needsAction: false },
      { key: "users", label: "Active users", value: activeUsers, deltaPct: null, sub: "Distinct actors", needsAction: false },
      { key: "sensitive", label: "Sensitive actions", value: sensitive, deltaPct: null, sub: "Role, delete, purge", needsAction: reviewCount > 0, reviewCount },
      { key: "failed", label: "Failed actions", value: failed, deltaPct: null, sub: "Rejected in range", needsAction: false },
    ],
  };
}

export async function computeInsights(days = 30): Promise<AuditInsights> {
  const start = new Date(Date.now() - days * 86400000);
  const useAudit = await auditTablesAvailable();
  let rows: AuditEventView[] = [];
  try {
    if (useAudit) {
      const found = (await db().auditEvent!.findMany({
        where: { createdAt: { gte: start } },
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 5000,
      })) as unknown as AuditRow[];
      rows = found.map(mapAuditRow);
    } else {
      const found = (await db().log!.findMany({
        where: { createdAt: { gte: start } },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 5000,
      })) as unknown as LegacyLog[];
      rows = found.map(mapLegacyLog);
    }
  } catch {
    rows = [];
  }
  const patterns: AuditPattern[] = [];
  const byUserRole = new Map<string, { at: number; count: number }[]>();
  for (const e of rows) {
    if (e.action !== "ROLE_CHANGE" || !e.actorId) continue;
    const list = byUserRole.get(e.entityId) ?? [];
    list.push({ at: new Date(e.createdAt).getTime(), count: 1 });
    byUserRole.set(e.entityId, list);
  }
  for (const [entityId, list] of byUserRole) {
    const sorted = [...list].sort((a, b) => a.at - b.at);
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].at - sorted[i - 1].at < 10 * 60 * 1000) {
        patterns.push({ key: `role-twice-${entityId}`, title: "Same user role changed twice in 10 minutes", detail: `User ${entityId.slice(0, 8)}… had two role changes minutes apart. Review for privilege escalation.`, severity: "critical", filter: { action: "ROLE_CHANGE", entity: "User", actor: "", q: entityId.slice(0, 8), from: "", to: "" } });
        break;
      }
    }
  }
  const bulkDeletes = rows.filter((e) => e.action === "BULK_DELETE");
  if (bulkDeletes.length > 0) {
    patterns.push({ key: "bulk-deletes", title: `${bulkDeletes.length} bulk delete${bulkDeletes.length === 1 ? "" : "s"} in range`, detail: "Bulk deletes remove many items at once. Confirm each batch was intended.", severity: "warning", filter: { action: "BULK_DELETE", entity: "", actor: "", q: "", from: "", to: "" } });
  }
  const createsByActor = new Map<string, number[]>();
  for (const e of rows) {
    if ((e.action !== "CREATE" && e.action !== "BULK_CREATE") || !e.actorId) continue;
    const t = new Date(e.createdAt).getTime();
    const list = createsByActor.get(e.actorId) ?? [];
    list.push(t);
    createsByActor.set(e.actorId, list);
  }
  for (const [actorId, times] of createsByActor) {
    const sorted = [...times].sort((a, b) => a - b);
    let burst = 1;
    for (let i = 1; i < sorted.length; i += 1) {
      burst = sorted[i] - sorted[i - 1] < 60000 ? burst + 1 : 1;
      if (burst >= 10) {
        const actor = rows.find((r) => r.actorId === actorId)?.actor;
        patterns.push({ key: `burst-${actorId}`, title: `Burst of creates by ${actor?.name || actor?.email || actorId.slice(0, 8)}`, detail: "10+ creates within a minute by one actor. Check for runaway imports.", severity: "warning", filter: { action: "CREATE", entity: "", actor: actorId, q: "", from: "", to: "" } });
        break;
      }
    }
  }
  const imports = rows.filter((e) => e.source === "BULK_IMPORT");
  if (imports.length >= 20) {
    patterns.push({ key: "large-import", title: `Large import batch (${imports.length} events)`, detail: "A large import ran in this range. Verify new departments and categories it introduced.", severity: "info", filter: { action: "", entity: "", actor: "", q: "", from: "", to: "" } });
  }
  const dayMap = new Map<string, number>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86400000);
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const e of rows) dayMap.set(e.createdAt.slice(0, 10), (dayMap.get(e.createdAt.slice(0, 10)) ?? 0) + 1);
  const counts = [...dayMap.values()];
  const mean = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
  const variance = counts.length ? counts.reduce((a, b) => a + (b - mean) ** 2, 0) / counts.length : 0;
  const sd = Math.sqrt(variance);
  const daily: AuditDayBucket[] = [...dayMap.entries()].map(([date, count]) => ({ date, count, anomaly: sd > 0 && count > mean + 2 * sd }));
  const byActionMap = new Map<string, number>();
  for (const e of rows) byActionMap.set(e.action, (byActionMap.get(e.action) ?? 0) + 1);
  const byAction = [...byActionMap.entries()].map(([action, count]) => ({ action, count, pct: rows.length ? Math.round((count / rows.length) * 1000) / 10 : 0 })).sort((a, b) => b.count - a.count);
  const actorMap = new Map<string, { name: string; email: string | null; count: number }>();
  for (const e of rows) {
    if (!e.actorId) continue;
    const cur = actorMap.get(e.actorId) ?? { name: e.actor?.name || e.actor?.email || e.actorId.slice(0, 8), email: e.actor?.email ?? null, count: 0 };
    cur.count += 1;
    actorMap.set(e.actorId, cur);
  }
  const topActors = [...actorMap.entries()].map(([actorId, v]) => ({ actorId, ...v })).sort((a, b) => b.count - a.count).slice(0, 8);
  const sectionMap = new Map<string, number>();
  for (const e of rows) sectionMap.set(e.entityType, (sectionMap.get(e.entityType) ?? 0) + 1);
  const bySection = [...sectionMap.entries()].map(([entityType, count]) => ({ entityType, count, pct: rows.length ? Math.round((count / rows.length) * 1000) / 10 : 0 })).sort((a, b) => b.count - a.count);
  return { patterns, daily, byAction, topActors, bySection, generatedAt: new Date().toISOString() };
}

export const DEFAULT_AUDIT_RULES: Omit<AuditAlertRuleView, "id">[] = [
  { name: "Role change to admin", condition: { action: "ROLE_CHANGE", toRole: ["ADMIN", "SUPER_ADMIN"] }, severity: "Critical", channels: ["Email"], enabled: true },
  { name: "Bulk delete of 5+ items", condition: { action: "BULK_DELETE", minCount: 5 }, severity: "Critical", channels: ["Email", "Telegram"], enabled: true },
  { name: "Same user role changed twice in 10 min", condition: { action: "ROLE_CHANGE", windowMin: 10, minCount: 2 }, severity: "Critical", channels: ["Email"], enabled: true },
  { name: "Delete outside business hours", condition: { action: "DELETE", outsideHours: true }, severity: "Warning", channels: ["Email"], enabled: true },
  { name: "Bulk import with errors", condition: { action: "BULK_CREATE", hasErrors: true }, severity: "Warning", channels: ["Email"], enabled: true },
  { name: "Log purge or retention change", condition: { action: "LOG_PURGE" }, severity: "Critical", channels: ["Email", "Telegram"], enabled: true },
];

export async function listAuditAlertRules(): Promise<AuditAlertRuleView[]> {
  try {
    if (await auditTablesAvailable()) {
      const rows = (await db().auditAlertRule!.findMany({ orderBy: { createdAt: "asc" } })) as unknown as { id: string; name: string; condition: Record<string, unknown>; severity: string; channels: string[]; enabled: boolean }[];
      if (rows.length > 0) return rows.map((r) => ({ id: r.id, name: r.name, condition: r.condition, severity: r.severity === "Critical" ? "Critical" : "Warning", channels: r.channels, enabled: r.enabled }));
      for (const d of DEFAULT_AUDIT_RULES) {
        await db().auditAlertRule!.create({ data: { name: d.name, condition: d.condition, severity: d.severity, channels: d.channels, enabled: d.enabled } });
      }
      const seeded = (await db().auditAlertRule!.findMany({ orderBy: { createdAt: "asc" } })) as unknown as { id: string; name: string; condition: Record<string, unknown>; severity: string; channels: string[]; enabled: boolean }[];
      return seeded.map((r) => ({ id: r.id, name: r.name, condition: r.condition, severity: r.severity === "Critical" ? "Critical" : "Warning", channels: r.channels, enabled: r.enabled }));
    }
  } catch {
  }
  return DEFAULT_AUDIT_RULES.map((d, i) => ({ ...d, id: `default-${i}` }));
}

export async function evaluateAuditAlerts(event: { action: string; entityType: string; actorId: string | null; summary: string }): Promise<string[]> {
  const rules = await listAuditAlertRules().catch(() => [] as AuditAlertRuleView[]);
  const hits: string[] = [];
  const hour = new Date().getHours();
  const outsideHours = hour < 9 || hour >= 18;
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const c = rule.condition as Record<string, unknown>;
    if (c.action && c.action !== event.action) continue;
    if (rule.name === "Delete outside business hours" && !outsideHours) continue;
    if (rule.name === "Role change to admin" && event.action === "ROLE_CHANGE" && !/ADMIN|SUPER_ADMIN/i.test(event.summary)) continue;
    hits.push(rule.id);
  }
  return hits;
}

export async function getRetentionState(): Promise<RetentionState> {
  const fallback: RetentionState = { keepDays: 90, archiveBeforeDelete: true, legalHold: false, storageUsedMb: 0, storageQuotaMb: 1024, updatedAt: null };
  try {
    if (await auditTablesAvailable()) {
      const row = (await db().retentionPolicy!.findFirst({ orderBy: { updatedAt: "desc" } })) as unknown as { keepDays: number | null; archiveBeforeDelete: boolean; legalHold: boolean; updatedAt: Date } | null;
      if (row) {
        const eventCount = await db().auditEvent!.count({ where: {} }).catch(() => 0);
        const logCount = await db().log!.count({ where: {} }).catch(() => 0);
        return { keepDays: row.keepDays, archiveBeforeDelete: row.archiveBeforeDelete, legalHold: row.legalHold, storageUsedMb: Math.round(((eventCount + logCount) * 0.004 + 12) * 10) / 10, storageQuotaMb: 1024, updatedAt: new Date(row.updatedAt).toISOString() };
      }
    }
    const total = await db().log!.count({ where: {} }).catch(() => 0);
    return { ...fallback, storageUsedMb: Math.round((total * 0.004 + 12) * 10) / 10 };
  } catch {
    return fallback;
  }
}

export async function saveRetentionState(input: { keepDays: number | null; archiveBeforeDelete: boolean; legalHold: boolean; actorId: string; actorRole: string | null }): Promise<RetentionState> {
  try {
    if (await auditTablesAvailable()) {
      const existing = (await db().retentionPolicy!.findFirst({ orderBy: { updatedAt: "desc" } })) as unknown as { id: string } | null;
      if (existing) await db().retentionPolicy!.update({ where: { id: existing.id }, data: { keepDays: input.keepDays, archiveBeforeDelete: input.archiveBeforeDelete, legalHold: input.legalHold } });
      else await db().retentionPolicy!.create({ data: { keepDays: input.keepDays, archiveBeforeDelete: input.archiveBeforeDelete, legalHold: input.legalHold, updatedById: input.actorId } });
    }
  } catch {
  }
  await writeAuditEvent({
    action: "UPDATE",
    entityType: "RetentionPolicy",
    entityId: "policy",
    actorId: input.actorId,
    actorRole: input.actorRole,
    summary: `Retention policy updated to ${input.keepDays === null ? "forever" : `${input.keepDays} days`}${input.legalHold ? " with legal hold" : ""}`,
    diff: { before: null, after: { keepDays: input.keepDays, archiveBeforeDelete: input.archiveBeforeDelete, legalHold: input.legalHold } },
    source: "ADMIN_UI",
  });
  return getRetentionState();
}

export async function getExportSchedule(): Promise<ExportScheduleState> {
  try {
    if (await auditTablesAvailable()) {
      const row = (await db().exportSchedule!.findFirst({ orderBy: { updatedAt: "desc" } })) as unknown as { enabled: boolean; frequency: string; format: string; recipients: string[] } | null;
      if (row) return { enabled: row.enabled, frequency: row.frequency, format: row.format === "JSON" ? "JSON" : "CSV", recipients: row.recipients };
    }
  } catch {
  }
  return { enabled: false, frequency: "WEEKLY", format: "CSV", recipients: [] };
}

export async function saveExportSchedule(input: ExportScheduleState & { actorId: string; actorRole: string | null }): Promise<ExportScheduleState> {
  try {
    if (await auditTablesAvailable()) {
      const existing = (await db().exportSchedule!.findFirst({ orderBy: { updatedAt: "desc" } })) as unknown as { id: string } | null;
      const data = { enabled: input.enabled, frequency: input.frequency, format: input.format, recipients: input.recipients };
      if (existing) await db().exportSchedule!.update({ where: { id: existing.id }, data });
      else await db().exportSchedule!.create({ data });
    }
  } catch {
  }
  await writeAuditEvent({
    action: "UPDATE",
    entityType: "ExportSchedule",
    entityId: "schedule",
    actorId: input.actorId,
    actorRole: input.actorRole,
    summary: `Scheduled export ${input.enabled ? "enabled" : "disabled"} (${input.frequency}, ${input.format})`,
    diff: { before: null, after: { enabled: input.enabled, frequency: input.frequency, format: input.format } },
    source: "ADMIN_UI",
  });
  return getExportSchedule();
}

export async function listAuditChannels(): Promise<AuditChannelView[]> {
  const defaults: AuditChannelView[] = [
    { type: "Email", connected: false, connectedAt: null },
    { type: "Telegram", connected: false, connectedAt: null },
    { type: "Webhook", connected: false, connectedAt: null },
  ];
  try {
    if (await auditTablesAvailable()) {
      const rows = (await db().auditChannel!.findMany({})) as unknown as { type: string; connected: boolean; connectedAt: Date | null }[];
      if (rows.length === 0) return defaults;
      return defaults.map((d) => {
        const found = rows.find((r) => r.type === d.type);
        return found ? { type: d.type, connected: found.connected, connectedAt: found.connectedAt ? new Date(found.connectedAt).toISOString() : null } : d;
      });
    }
  } catch {
  }
  return defaults;
}

export async function countOlderThan(days: number): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86400000);
  try {
    if (await auditTablesAvailable()) {
      const [a, b] = await Promise.all([
        db().auditEvent!.count({ where: { createdAt: { lt: cutoff } } }).catch(() => 0),
        db().log!.count({ where: { createdAt: { lt: cutoff } } }).catch(() => 0),
      ]);
      return a + b;
    }
    return await db().log!.count({ where: { createdAt: { lt: cutoff } } }).catch(() => 0);
  } catch {
    return 0;
  }
}

export async function purgeOlderThan(input: { days: number; actorId: string; actorEmail: string | null; actorRole: string | null; archive: boolean }): Promise<{ deleted: number; archived: boolean }> {
  const policy = await getRetentionState();
  if (policy.legalHold) {
    const err = new Error("Purge blocked: legal hold is on");
    (err as Error & { status?: number }).status = 409;
    throw err;
  }
  const cutoff = new Date(Date.now() - input.days * 86400000);
  const toDelete = await countOlderThan(input.days);
  let archived = false;
  if (input.archive && toDelete > 0) {
    try {
      if (await auditTablesAvailable()) {
        const checksum = sha256Hex(`archive:${cutoff.toISOString()}:${toDelete}:${randomUUID()}`);
        await db().logArchive!.create({ data: { period: `before-${cutoff.toISOString().slice(0, 10)}`, fileUrl: `/archives/audit-${cutoff.toISOString().slice(0, 10)}.csv.gz`, eventCount: toDelete, checksum, createdById: input.actorId } });
        archived = true;
      }
    } catch {
      archived = false;
    }
  }
  let deleted = 0;
  try {
    if (await auditTablesAvailable()) {
      const r = await db().auditEvent!.deleteMany({ where: { createdAt: { lt: cutoff } } }).catch(() => ({ count: 0 }));
      deleted += r.count;
    }
  } catch {
  }
  try {
    const r = await db().log!.deleteMany({ where: { createdAt: { lt: cutoff } } }).catch(() => ({ count: 0 }));
    deleted += r.count;
  } catch {
  }
  await writeAuditEvent({
    action: "LOG_PURGE",
    entityType: "Log",
    entityId: `purge-${cutoff.toISOString().slice(0, 10)}`,
    actorId: input.actorId,
    actorRole: input.actorRole,
    summary: `Purged ${deleted} events older than ${input.days} days${archived ? " (archived first)" : ""} by ${input.actorEmail ?? input.actorId}`,
    diff: { before: { olderThanDays: input.days, affected: toDelete }, after: { deleted, archived } },
    source: "ADMIN_UI",
  });
  return { deleted, archived };
}

export function toCsv(rows: AuditEventView[], mine: boolean): string {
  const headers = mine ? ["id", "createdAt", "action", "entityType", "entityId", "summary", "source"] : ["id", "createdAt", "action", "entityType", "entityId", "actor", "actorRole", "summary", "source", "flagged", "reviewedAt"];
  const esc = (v: unknown): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const e of rows) {
    const actor = e.actor?.email || e.actor?.name || "";
    const vals = mine ? [e.id, e.createdAt, e.action, e.entityType, e.entityId, e.summary, e.source] : [e.id, e.createdAt, e.action, e.entityType, e.entityId, actor, e.actorRole ?? "", e.summary, e.source, e.flagged ? "yes" : "no", e.reviewedAt ?? ""];
    lines.push(vals.map(esc).join(","));
  }
  return lines.join("\n");
}

export function projectForRole(event: AuditEventView, role: string | null | undefined): AuditEventView {
  if (role === "SUPER_ADMIN") return event;
  return { ...event, ipAddress: null, requestId: null, note: null, flagged: false, hash: null };
}
