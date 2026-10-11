-- Audit control center: append-only tamper-evident audit events + retention/archive/alerts.
-- Creates new tables only; never alters the legacy Log table.

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'BULK_CREATE', 'UPDATE', 'APPROVE', 'BULK_APPROVE', 'REJECT', 'DELETE', 'BULK_DELETE', 'ROLE_CHANGE', 'LOG_PURGE');
CREATE TYPE "AuditSource" AS ENUM ('ADMIN_UI', 'API', 'BULK_IMPORT', 'CRAWLER');

-- CreateTable AuditEvent
CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "action" "AuditAction" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "actorId" TEXT,
  "actorRole" TEXT,
  "summary" TEXT NOT NULL,
  "diff" JSONB,
  "source" "AuditSource" NOT NULL DEFAULT 'ADMIN_UI',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "requestId" TEXT,
  "flagged" BOOLEAN NOT NULL DEFAULT false,
  "reviewedAt" TIMESTAMP(3),
  "reviewedById" TEXT,
  "note" TEXT,
  "prevHash" TEXT,
  "hash" TEXT NOT NULL,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");
CREATE INDEX "AuditEvent_action_idx" ON "AuditEvent"("action");
CREATE INDEX "AuditEvent_entityType_idx" ON "AuditEvent"("entityType");
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");
CREATE INDEX "AuditEvent_flagged_idx" ON "AuditEvent"("flagged");
CREATE INDEX "AuditEvent_createdAt_action_idx" ON "AuditEvent"("createdAt", "action");
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable RetentionPolicy
CREATE TABLE "RetentionPolicy" (
  "id" TEXT NOT NULL,
  "keepDays" INTEGER,
  "archiveBeforeDelete" BOOLEAN NOT NULL DEFAULT true,
  "legalHold" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedById" TEXT,
  CONSTRAINT "RetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable ExportSchedule
CREATE TABLE "ExportSchedule" (
  "id" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "frequency" TEXT NOT NULL DEFAULT 'WEEKLY',
  "format" TEXT NOT NULL DEFAULT 'CSV',
  "recipients" TEXT[] NOT NULL DEFAULT '{}',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable AuditAlertRule
CREATE TABLE "AuditAlertRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "condition" JSONB NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'Warning',
  "channels" TEXT[] NOT NULL DEFAULT '{}',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuditAlertRule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditAlertRule_enabled_idx" ON "AuditAlertRule"("enabled");

-- CreateTable AuditChannel
CREATE TABLE "AuditChannel" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "config" JSONB,
  "connected" BOOLEAN NOT NULL DEFAULT false,
  "connectedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuditChannel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AuditChannel_type_key" ON "AuditChannel"("type");

-- CreateTable LogArchive
CREATE TABLE "LogArchive" (
  "id" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "eventCount" INTEGER NOT NULL,
  "checksum" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT,
  CONSTRAINT "LogArchive_pkey" PRIMARY KEY ("id")
);

-- Append-only guard: revoke UPDATE/DELETE is enforced at the application layer and
-- by the API (no update/delete routes exist). Database-level REVOKE statements are
-- left to the DBA during deploy because the migration role owns the tables:
--   REVOKE UPDATE, DELETE ON "AuditEvent" FROM app_role;
-- The purge job uses a dedicated role with a narrow GRANT.
