-- Careers-page (Gemini) and Ashby feeds, plus the super-admin seeding controls.
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PrivateJobFeedProvider" ADD VALUE 'ASHBY';
ALTER TYPE "PrivateJobFeedProvider" ADD VALUE 'CAREER_PAGE';

-- AlterTable
ALTER TABLE "PrivateJob" ADD COLUMN     "aiConfidence" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "PrivateJobFeed" ADD COLUMN     "pageHash" TEXT,
ADD COLUMN     "pageUrl" TEXT;

-- CreateTable
CREATE TABLE "PrivateFeedSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "intervalHours" INTEGER NOT NULL DEFAULT 6,
    "autoPublishAi" BOOLEAN NOT NULL DEFAULT false,
    "minConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "maxAiPagesPerRun" INTEGER NOT NULL DEFAULT 3,
    "geminiModel" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "PrivateFeedSettings_pkey" PRIMARY KEY ("id")
);

