-- Indexes backing the public listing filters and sort controls.

CREATE INDEX "Job_lastDate_idx" ON "Job"("lastDate");
CREATE INDEX "Job_totalVacancies_idx" ON "Job"("totalVacancies");
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

CREATE INDEX "PrivateJob_category_idx" ON "PrivateJob"("category");
CREATE INDEX "PrivateJob_location_idx" ON "PrivateJob"("location");
CREATE INDEX "PrivateJob_expMin_idx" ON "PrivateJob"("expMin");
CREATE INDEX "PrivateJob_salaryMax_idx" ON "PrivateJob"("salaryMax");
CREATE INDEX "PrivateJob_createdAt_idx" ON "PrivateJob"("createdAt");

CREATE INDEX "Result_resultDate_idx" ON "Result"("resultDate");
CREATE INDEX "Result_createdAt_idx" ON "Result"("createdAt");

CREATE INDEX "AdmitCard_examDate_idx" ON "AdmitCard"("examDate");
CREATE INDEX "AdmitCard_createdAt_idx" ON "AdmitCard"("createdAt");

CREATE INDEX "AnswerKey_createdAt_idx" ON "AnswerKey"("createdAt");

CREATE INDEX "Syllabus_createdAt_idx" ON "Syllabus"("createdAt");

CREATE INDEX "Admission_lastDate_idx" ON "Admission"("lastDate");
CREATE INDEX "Admission_startDate_idx" ON "Admission"("startDate");
CREATE INDEX "Admission_createdAt_idx" ON "Admission"("createdAt");
