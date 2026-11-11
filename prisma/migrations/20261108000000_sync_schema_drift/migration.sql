-- Brings the migration history in line with prisma/schema.prisma.
-- These tables and columns were added to the schema without a migration
-- (production received them via `prisma db push`), so a fresh database could
-- not be built from migrations alone. Every statement is idempotent: on a
-- database that already has them (production) this migration changes nothing.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "RemotePolicy" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CompanyVerification" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PrivateAppStatus" AS ENUM ('saved', 'applied', 'shortlisted', 'interview', 'offer', 'joined', 'rejected', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReferralStatus2" AS ENUM ('PENDING', 'CONFIRMED', 'REWARDED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CoinKind" AS ENUM ('JOB_LIVE_7D', 'THREE_APPS', 'INTERVIEW_CONFIRMED', 'HIRE_CONFIRMED', 'REFERRAL_BONUS', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CoinStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "JobClickKind" AS ENUM ('APPLY', 'EMAIL', 'DETAIL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "UserAgentClass" AS ENUM ('human', 'search_bot', 'unknown_bot');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "HealthStatus" AS ENUM ('ok', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "AlertChannel" AS ENUM ('Email', 'Telegram');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "claimEmailDomain" TEXT,
ADD COLUMN IF NOT EXISTS "hq" TEXT,
ADD COLUMN IF NOT EXISTS "industry" TEXT,
ADD COLUMN IF NOT EXISTS "responseRate" INTEGER,
ADD COLUMN IF NOT EXISTS "size" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "verifiedStatus" "CompanyVerification" NOT NULL DEFAULT 'UNVERIFIED';

-- AlterTable
ALTER TABLE "PrivateJob" ADD COLUMN IF NOT EXISTS "expMax" INTEGER,
ADD COLUMN IF NOT EXISTS "expMin" INTEGER,
ADD COLUMN IF NOT EXISTS "isFresherFriendly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isWalkIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "proofUrl" TEXT,
ADD COLUMN IF NOT EXISTS "qualification" TEXT,
ADD COLUMN IF NOT EXISTS "remotePolicy" "RemotePolicy",
ADD COLUMN IF NOT EXISTS "salaryMax" INTEGER,
ADD COLUMN IF NOT EXISTS "salaryMin" INTEGER,
ADD COLUMN IF NOT EXISTS "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "trustScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "vacancies" INTEGER,
ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "walkInDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "walkInVenue" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PrivateJobView" (
    "id" TEXT NOT NULL,
    "privateJobId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivateJobView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CompanyMember" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PrivateApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "privateJobId" TEXT NOT NULL,
    "status" "PrivateAppStatus" NOT NULL DEFAULT 'saved',
    "interviewAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JobReferral" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "proofUrl" TEXT,
    "location" TEXT,
    "userId" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JobReport" (
    "id" TEXT NOT NULL,
    "privateJobId" TEXT NOT NULL,
    "userId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CompanyOtpChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT,
    "pendingName" TEXT,
    "pendingWebsite" TEXT,
    "pendingDescription" TEXT,
    "workEmail" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyOtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EmployerReferralCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployerReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EmployerReferral" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "companyId" TEXT,
    "status" "ReferralStatus2" NOT NULL DEFAULT 'PENDING',
    "signupBonusPaise" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "EmployerReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PayoutAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "upiId" TEXT NOT NULL,
    "accountHolder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PayoutRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "amountCoins" INTEGER,
    "upiSnapshot" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CoinLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT,
    "jobId" TEXT,
    "kind" "CoinKind" NOT NULL,
    "coins" INTEGER NOT NULL,
    "status" "CoinStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RewardEnrollment" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardedJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JobClick" (
    "id" TEXT NOT NULL,
    "privateJobId" TEXT NOT NULL,
    "kind" "JobClickKind" NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PageViewEvent" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "deviceType" TEXT NOT NULL DEFAULT 'desktop',
    "state" TEXT,
    "userAgent" TEXT,
    "userAgentClass" "UserAgentClass" NOT NULL DEFAULT 'human',
    "botVerified" BOOLEAN NOT NULL DEFAULT false,
    "hashedIp" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageViewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SearchQuery" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "OutboundClick" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "targetUrl" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboundClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WebVitalEvent" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "path" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebVitalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CrawlerRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'internal',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "imported" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "detail" TEXT,

    CONSTRAINT "CrawlerRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "HealthCheckResult" (
    "key" TEXT NOT NULL,
    "status" "HealthStatus" NOT NULL DEFAULT 'ok',
    "detail" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthCheckResult_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AlertRule" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "channels" "AlertChannel"[] DEFAULT ARRAY[]::"AlertChannel"[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AlertEvent" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "channels" "AlertChannel"[] DEFAULT ARRAY[]::"AlertChannel"[],
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AnalyticsDay" (
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "views" INTEGER NOT NULL DEFAULT 0,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "humanShare" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "botShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "signups" INTEGER NOT NULL DEFAULT 0,
    "jobsPublished" INTEGER NOT NULL DEFAULT 0,
    "latencyP95" DOUBLE PRECISION,
    "errorRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "avgTimeOnPageMs" INTEGER,

    CONSTRAINT "AnalyticsDay_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AnalyticsModuleDay" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "module" TEXT NOT NULL,
    "items" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "viewsPerItem" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "AnalyticsModuleDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "IntegrationSetting" (
    "key" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "metrics" JSONB,
    "connectedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateJobView_privateJobId_idx" ON "PrivateJobView"("privateJobId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateJobView_date_idx" ON "PrivateJobView"("date");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PrivateJobView_privateJobId_date_key" ON "PrivateJobView"("privateJobId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompanyMember_companyId_idx" ON "CompanyMember"("companyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompanyMember_userId_idx" ON "CompanyMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyMember_companyId_userId_key" ON "CompanyMember"("companyId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateApplication_userId_status_idx" ON "PrivateApplication"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateApplication_privateJobId_idx" ON "PrivateApplication"("privateJobId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateApplication_privateJobId_status_idx" ON "PrivateApplication"("privateJobId", "status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PrivateApplication_userId_privateJobId_key" ON "PrivateApplication"("userId", "privateJobId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobReferral_status_idx" ON "JobReferral"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobReferral_userId_idx" ON "JobReferral"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobReferral_createdAt_idx" ON "JobReferral"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobReport_privateJobId_idx" ON "JobReport"("privateJobId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobReport_status_idx" ON "JobReport"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompanyOtpChallenge_userId_idx" ON "CompanyOtpChallenge"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompanyOtpChallenge_workEmail_idx" ON "CompanyOtpChallenge"("workEmail");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompanyOtpChallenge_expiresAt_idx" ON "CompanyOtpChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CompanyOtpChallenge_userId_createdAt_idx" ON "CompanyOtpChallenge"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmployerReferralCode_userId_key" ON "EmployerReferralCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmployerReferralCode_code_key" ON "EmployerReferralCode"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmployerReferralCode_code_idx" ON "EmployerReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EmployerReferral_referredUserId_key" ON "EmployerReferral"("referredUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmployerReferral_referrerUserId_idx" ON "EmployerReferral"("referrerUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmployerReferral_status_idx" ON "EmployerReferral"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EmployerReferral_companyId_idx" ON "EmployerReferral"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PayoutAccount_userId_key" ON "PayoutAccount"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PayoutRequest_userId_idx" ON "PayoutRequest"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PayoutRequest_status_idx" ON "PayoutRequest"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CoinLedger_userId_idx" ON "CoinLedger"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CoinLedger_userId_status_idx" ON "CoinLedger"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CoinLedger_companyId_idx" ON "CoinLedger"("companyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CoinLedger_jobId_idx" ON "CoinLedger"("jobId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CoinLedger_kind_idx" ON "CoinLedger"("kind");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CoinLedger_companyId_jobId_kind_idx" ON "CoinLedger"("companyId", "jobId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RewardEnrollment_companyId_key" ON "RewardEnrollment"("companyId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RewardEnrollment_userId_idx" ON "RewardEnrollment"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobClick_privateJobId_idx" ON "JobClick"("privateJobId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "JobClick_privateJobId_kind_day_idx" ON "JobClick"("privateJobId", "kind", "day");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "JobClick_privateJobId_kind_sessionHash_day_key" ON "JobClick"("privateJobId", "kind", "sessionHash", "day");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PageViewEvent_createdAt_idx" ON "PageViewEvent"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PageViewEvent_path_idx" ON "PageViewEvent"("path");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PageViewEvent_entityType_entityId_idx" ON "PageViewEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PageViewEvent_sessionId_idx" ON "PageViewEvent"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PageViewEvent_userId_idx" ON "PageViewEvent"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PageViewEvent_userAgentClass_idx" ON "PageViewEvent"("userAgentClass");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PageViewEvent_state_idx" ON "PageViewEvent"("state");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SearchQuery_term_idx" ON "SearchQuery"("term");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SearchQuery_createdAt_idx" ON "SearchQuery"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SearchQuery_resultCount_idx" ON "SearchQuery"("resultCount");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OutboundClick_jobId_idx" ON "OutboundClick"("jobId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OutboundClick_createdAt_idx" ON "OutboundClick"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WebVitalEvent_metric_createdAt_idx" ON "WebVitalEvent"("metric", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WebVitalEvent_path_idx" ON "WebVitalEvent"("path");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CrawlerRun_startedAt_idx" ON "CrawlerRun"("startedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AlertRule_metric_idx" ON "AlertRule"("metric");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AlertRule_enabled_idx" ON "AlertRule"("enabled");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AlertEvent_ruleId_idx" ON "AlertEvent"("ruleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AlertEvent_sentAt_idx" ON "AlertEvent"("sentAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AnalyticsDay_date_idx" ON "AnalyticsDay"("date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AnalyticsModuleDay_module_date_idx" ON "AnalyticsModuleDay"("module", "date");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AnalyticsModuleDay_date_module_key" ON "AnalyticsModuleDay"("date", "module");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Admission_lastDate_idx" ON "Admission"("lastDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Admission_startDate_idx" ON "Admission"("startDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Admission_createdAt_idx" ON "Admission"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdmitCard_examDate_idx" ON "AdmitCard"("examDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdmitCard_createdAt_idx" ON "AdmitCard"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AnswerKey_createdAt_idx" ON "AnswerKey"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Company_verifiedStatus_idx" ON "Company"("verifiedStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Job_lastDate_idx" ON "Job"("lastDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Job_totalVacancies_idx" ON "Job"("totalVacancies");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateJob_remotePolicy_idx" ON "PrivateJob"("remotePolicy");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateJob_isFresherFriendly_idx" ON "PrivateJob"("isFresherFriendly");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateJob_isWalkIn_idx" ON "PrivateJob"("isWalkIn");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateJob_salaryMin_idx" ON "PrivateJob"("salaryMin");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateJob_trustScore_idx" ON "PrivateJob"("trustScore");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateJob_category_idx" ON "PrivateJob"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateJob_location_idx" ON "PrivateJob"("location");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateJob_expMin_idx" ON "PrivateJob"("expMin");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateJob_salaryMax_idx" ON "PrivateJob"("salaryMax");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PrivateJob_createdAt_idx" ON "PrivateJob"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Result_resultDate_idx" ON "Result"("resultDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Result_createdAt_idx" ON "Result"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Syllabus_createdAt_idx" ON "Syllabus"("createdAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PrivateJobView" ADD CONSTRAINT "PrivateJobView_privateJobId_fkey" FOREIGN KEY ("privateJobId") REFERENCES "PrivateJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "CompanyMember" ADD CONSTRAINT "CompanyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PrivateApplication" ADD CONSTRAINT "PrivateApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PrivateApplication" ADD CONSTRAINT "PrivateApplication_privateJobId_fkey" FOREIGN KEY ("privateJobId") REFERENCES "PrivateJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "JobReferral" ADD CONSTRAINT "JobReferral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "JobReport" ADD CONSTRAINT "JobReport_privateJobId_fkey" FOREIGN KEY ("privateJobId") REFERENCES "PrivateJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "JobReport" ADD CONSTRAINT "JobReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "CompanyOtpChallenge" ADD CONSTRAINT "CompanyOtpChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "CompanyOtpChallenge" ADD CONSTRAINT "CompanyOtpChallenge_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "EmployerReferralCode" ADD CONSTRAINT "EmployerReferralCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "EmployerReferral" ADD CONSTRAINT "EmployerReferral_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "EmployerReferral" ADD CONSTRAINT "EmployerReferral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PayoutAccount" ADD CONSTRAINT "PayoutAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "CoinLedger" ADD CONSTRAINT "CoinLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "RewardEnrollment" ADD CONSTRAINT "RewardEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "JobClick" ADD CONSTRAINT "JobClick_privateJobId_fkey" FOREIGN KEY ("privateJobId") REFERENCES "PrivateJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AlertEvent" ADD CONSTRAINT "AlertEvent_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlertRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
