-- International private jobs: country + city per opening, more job-board providers, discovery queue.
ALTER TABLE "PrivateJob" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "PrivateJob" ADD COLUMN IF NOT EXISTS "city" TEXT;
CREATE INDEX IF NOT EXISTS "PrivateJob_country_city_idx" ON "PrivateJob"("country", "city");

ALTER TYPE "PrivateJobFeedProvider" ADD VALUE IF NOT EXISTS 'SMARTRECRUITERS';
ALTER TYPE "PrivateJobFeedProvider" ADD VALUE IF NOT EXISTS 'WORKABLE';
ALTER TYPE "PrivateJobFeedProvider" ADD VALUE IF NOT EXISTS 'RECRUITEE';
ALTER TYPE "PrivateJobFeedProvider" ADD VALUE IF NOT EXISTS 'PERSONIO';
ALTER TYPE "PrivateJobFeedProvider" ADD VALUE IF NOT EXISTS 'BREEZY';

CREATE TABLE IF NOT EXISTS "PrivateFeedCandidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "boardToken" TEXT,
    "jobs" INTEGER,
    "note" TEXT,
    "indiaOnly" BOOLEAN NOT NULL DEFAULT false,
    "feedId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    CONSTRAINT "PrivateFeedCandidate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PrivateFeedCandidate_name_key" ON "PrivateFeedCandidate"("name");
CREATE INDEX IF NOT EXISTS "PrivateFeedCandidate_status_checkedAt_idx" ON "PrivateFeedCandidate"("status", "checkedAt");
