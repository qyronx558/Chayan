-- CreateEnum
CREATE TYPE "IngestStatus" AS ENUM ('POSTED', 'SKIPPED', 'DUPLICATE', 'FAILED');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "summary" TEXT;

-- CreateTable
CREATE TABLE "IngestItem" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "urlHash" TEXT NOT NULL,
    "contentHash" TEXT,
    "kind" TEXT NOT NULL,
    "status" "IngestStatus" NOT NULL,
    "reason" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "confidence" DOUBLE PRECISION,
    "quality" INTEGER,
    "autoApproved" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IngestItem_urlHash_key" ON "IngestItem"("urlHash");

-- CreateIndex
CREATE INDEX "IngestItem_sourceId_createdAt_idx" ON "IngestItem"("sourceId", "createdAt");

-- CreateIndex
CREATE INDEX "IngestItem_contentHash_idx" ON "IngestItem"("contentHash");

-- CreateIndex
CREATE INDEX "IngestItem_status_idx" ON "IngestItem"("status");

-- CreateIndex
CREATE INDEX "IngestItem_entityType_entityId_idx" ON "IngestItem"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "IngestItem_autoApproved_createdAt_idx" ON "IngestItem"("autoApproved", "createdAt");
