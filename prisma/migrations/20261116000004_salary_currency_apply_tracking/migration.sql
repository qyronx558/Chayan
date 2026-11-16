-- Salaries in the job's own currency (yearly), and apply-click tracking for candidates.
ALTER TABLE "PrivateJob" ADD COLUMN IF NOT EXISTS "salaryCurrency" TEXT;
ALTER TABLE "PrivateJob" ADD COLUMN IF NOT EXISTS "salaryLocalMin" INTEGER;
ALTER TABLE "PrivateJob" ADD COLUMN IF NOT EXISTS "salaryLocalMax" INTEGER;

ALTER TABLE "PrivateApplication" ADD COLUMN IF NOT EXISTS "appliedAt" TIMESTAMP(3);
ALTER TABLE "PrivateApplication" ADD COLUMN IF NOT EXISTS "source" TEXT;
-- Existing "applied" (or later) records: the last update is the best known apply time.
UPDATE "PrivateApplication" SET "appliedAt" = "updatedAt"
WHERE "appliedAt" IS NULL AND "status" IN ('applied', 'shortlisted', 'interview', 'offer', 'joined', 'rejected');
