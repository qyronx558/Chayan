-- CreateEnum
CREATE TYPE "JobLevel" AS ENUM ('central', 'state', 'district');

-- CreateEnum
CREATE TYPE "StateType" AS ENUM ('state', 'union_territory');

-- AlterTable
ALTER TABLE "State" ADD COLUMN     "type" "StateType" NOT NULL DEFAULT 'state',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "districtId" TEXT,
ADD COLUMN     "jobLevel" "JobLevel" NOT NULL DEFAULT 'central';

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "District_stateId_idx" ON "District"("stateId");

-- CreateIndex
CREATE INDEX "District_slug_idx" ON "District"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "District_stateId_slug_key" ON "District"("stateId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "District_stateId_name_key" ON "District"("stateId", "name");

-- CreateIndex
CREATE INDEX "State_type_idx" ON "State"("type");

-- CreateIndex
CREATE INDEX "Job_jobLevel_idx" ON "Job"("jobLevel");

-- CreateIndex
CREATE INDEX "Job_districtId_idx" ON "Job"("districtId");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Backfill: jobs that already carry a state were posted as state jobs;
-- everything else is open to all of India.
UPDATE "Job" SET "jobLevel" = 'state' WHERE "stateId" IS NOT NULL;

-- Keep level and location fields consistent (not modelled in Prisma, so it
-- does not show up as schema drift):
--   state    -> a state is set
--   district -> a state and a district are set
--   a district is only ever set on district jobs
ALTER TABLE "Job" ADD CONSTRAINT "Job_location_level_check" CHECK (
  ("jobLevel" <> 'state' OR "stateId" IS NOT NULL)
  AND ("jobLevel" <> 'district' OR ("stateId" IS NOT NULL AND "districtId" IS NOT NULL))
  AND ("districtId" IS NULL OR "jobLevel" = 'district')
);
