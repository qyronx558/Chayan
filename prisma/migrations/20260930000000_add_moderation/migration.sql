-- User management: super-admin content verification (approve/reject) for all 8 content types.
-- Existing rows backfill to APPROVED so the public site keeps serving current content.

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable Job
ALTER TABLE "Job" ADD COLUMN "moderation" "ModerationStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Job" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "Job" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN "reviewNote" TEXT;
CREATE INDEX "Job_moderation_idx" ON "Job"("moderation");
CREATE INDEX "Job_createdById_moderation_idx" ON "Job"("createdById", "moderation");

-- AlterTable PrivateJob
ALTER TABLE "PrivateJob" ADD COLUMN "moderation" "ModerationStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "PrivateJob" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "PrivateJob" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "PrivateJob" ADD COLUMN "reviewNote" TEXT;
CREATE INDEX "PrivateJob_moderation_idx" ON "PrivateJob"("moderation");
CREATE INDEX "PrivateJob_createdById_moderation_idx" ON "PrivateJob"("createdById", "moderation");

-- AlterTable Result
ALTER TABLE "Result" ADD COLUMN "moderation" "ModerationStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Result" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "Result" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Result" ADD COLUMN "reviewNote" TEXT;
CREATE INDEX "Result_moderation_idx" ON "Result"("moderation");
CREATE INDEX "Result_createdById_moderation_idx" ON "Result"("createdById", "moderation");

-- AlterTable AdmitCard
ALTER TABLE "AdmitCard" ADD COLUMN "moderation" "ModerationStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "AdmitCard" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "AdmitCard" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "AdmitCard" ADD COLUMN "reviewNote" TEXT;
CREATE INDEX "AdmitCard_moderation_idx" ON "AdmitCard"("moderation");
CREATE INDEX "AdmitCard_createdById_moderation_idx" ON "AdmitCard"("createdById", "moderation");

-- AlterTable AnswerKey
ALTER TABLE "AnswerKey" ADD COLUMN "moderation" "ModerationStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "AnswerKey" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "AnswerKey" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "AnswerKey" ADD COLUMN "reviewNote" TEXT;
CREATE INDEX "AnswerKey_moderation_idx" ON "AnswerKey"("moderation");
CREATE INDEX "AnswerKey_createdById_moderation_idx" ON "AnswerKey"("createdById", "moderation");

-- AlterTable Admission
ALTER TABLE "Admission" ADD COLUMN "moderation" "ModerationStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Admission" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "Admission" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Admission" ADD COLUMN "reviewNote" TEXT;
CREATE INDEX "Admission_moderation_idx" ON "Admission"("moderation");
CREATE INDEX "Admission_createdById_moderation_idx" ON "Admission"("createdById", "moderation");

-- AlterTable Syllabus
ALTER TABLE "Syllabus" ADD COLUMN "moderation" "ModerationStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Syllabus" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "Syllabus" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Syllabus" ADD COLUMN "reviewNote" TEXT;
CREATE INDEX "Syllabus_moderation_idx" ON "Syllabus"("moderation");
CREATE INDEX "Syllabus_createdById_moderation_idx" ON "Syllabus"("createdById", "moderation");

-- AlterTable BlogPost
ALTER TABLE "BlogPost" ADD COLUMN "moderation" "ModerationStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "BlogPost" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "BlogPost" ADD COLUMN "reviewNote" TEXT;
CREATE INDEX "BlogPost_moderation_idx" ON "BlogPost"("moderation");
CREATE INDEX "BlogPost_createdById_moderation_idx" ON "BlogPost"("createdById", "moderation");
