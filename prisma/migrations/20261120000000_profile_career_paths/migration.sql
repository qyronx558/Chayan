-- Private-sector career details, so company-job seekers get the same depth of profile as government aspirants.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "govInterest" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privateInterest" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "headline" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "experienceYears" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "expectedSalary" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredCities" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "workModes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "jobTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
