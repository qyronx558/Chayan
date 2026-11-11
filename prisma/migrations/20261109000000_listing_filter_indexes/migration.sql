-- Indexes backing the public listing filters and sort controls.

CREATE INDEX IF NOT EXISTS "Job_lastDate_idx" ON "Job"("lastDate");
CREATE INDEX IF NOT EXISTS "Job_totalVacancies_idx" ON "Job"("totalVacancies");
CREATE INDEX IF NOT EXISTS "Job_createdAt_idx" ON "Job"("createdAt");

CREATE INDEX IF NOT EXISTS "PrivateJob_category_idx" ON "PrivateJob"("category");
CREATE INDEX IF NOT EXISTS "PrivateJob_location_idx" ON "PrivateJob"("location");
CREATE INDEX IF NOT EXISTS "PrivateJob_expMin_idx" ON "PrivateJob"("expMin");
CREATE INDEX IF NOT EXISTS "PrivateJob_salaryMax_idx" ON "PrivateJob"("salaryMax");
CREATE INDEX IF NOT EXISTS "PrivateJob_createdAt_idx" ON "PrivateJob"("createdAt");

CREATE INDEX IF NOT EXISTS "Result_resultDate_idx" ON "Result"("resultDate");
CREATE INDEX IF NOT EXISTS "Result_createdAt_idx" ON "Result"("createdAt");

CREATE INDEX IF NOT EXISTS "AdmitCard_examDate_idx" ON "AdmitCard"("examDate");
CREATE INDEX IF NOT EXISTS "AdmitCard_createdAt_idx" ON "AdmitCard"("createdAt");

CREATE INDEX IF NOT EXISTS "AnswerKey_createdAt_idx" ON "AnswerKey"("createdAt");

CREATE INDEX IF NOT EXISTS "Syllabus_createdAt_idx" ON "Syllabus"("createdAt");

CREATE INDEX IF NOT EXISTS "Admission_lastDate_idx" ON "Admission"("lastDate");
CREATE INDEX IF NOT EXISTS "Admission_startDate_idx" ON "Admission"("startDate");
CREATE INDEX IF NOT EXISTS "Admission_createdAt_idx" ON "Admission"("createdAt");
