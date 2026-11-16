-- Automatic company logo lookup: remembers when a company was last checked.
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "logoCheckedAt" TIMESTAMP(3);
