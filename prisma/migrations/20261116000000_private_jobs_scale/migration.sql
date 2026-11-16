-- Private jobs at scale: feed (ATS) sync, lifecycle/expiry fields and search indexes.
-- pg_trgm backs the case-insensitive "contains" search on title, location and company name.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "PrivateJobSource" AS ENUM ('MANUAL', 'EMPLOYER', 'ATS_FEED');

-- CreateEnum
CREATE TYPE "PrivateJobFeedProvider" AS ENUM ('GREENHOUSE', 'LEVER');

-- AlterTable
ALTER TABLE "PrivateJob" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "dedupeHash" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "feedId" TEXT,
ADD COLUMN     "feedMisses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "source" "PrivateJobSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sourceUrl" TEXT;

-- CreateTable
CREATE TABLE "PrivateJobFeed" (
    "id" TEXT NOT NULL,
    "provider" "PrivateJobFeedProvider" NOT NULL,
    "boardToken" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "indiaOnly" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "lastError" TEXT,
    "lastStats" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "PrivateJobFeed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrivateJobFeed_enabled_lastRunAt_idx" ON "PrivateJobFeed"("enabled", "lastRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateJobFeed_provider_boardToken_key" ON "PrivateJobFeed"("provider", "boardToken");

-- CreateIndex
CREATE INDEX "Company_name_trgm_idx" ON "Company" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "PrivateJob_moderation_status_createdAt_idx" ON "PrivateJob"("moderation", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PrivateJob_status_expiresAt_idx" ON "PrivateJob"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "PrivateJob_status_lastDate_idx" ON "PrivateJob"("status", "lastDate");

-- CreateIndex
CREATE INDEX "PrivateJob_dedupeHash_idx" ON "PrivateJob"("dedupeHash");

-- CreateIndex
CREATE INDEX "PrivateJob_title_trgm_idx" ON "PrivateJob" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "PrivateJob_location_trgm_idx" ON "PrivateJob" USING GIN ("location" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "PrivateJob_skills_gin_idx" ON "PrivateJob" USING GIN ("skills");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateJob_feedId_externalId_key" ON "PrivateJob"("feedId", "externalId");

-- AddForeignKey
ALTER TABLE "PrivateJob" ADD CONSTRAINT "PrivateJob_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "PrivateJobFeed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateJobFeed" ADD CONSTRAINT "PrivateJobFeed_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

