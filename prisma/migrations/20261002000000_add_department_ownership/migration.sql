-- Department ownership: ADMINs can only edit/delete departments they created.
-- Existing rows keep createdById NULL (system / super-admin owned).

-- AlterTable Department
ALTER TABLE "Department" ADD COLUMN "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Department_createdById_idx" ON "Department"("createdById");
