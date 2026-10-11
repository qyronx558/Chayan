-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emailChangeExpiry" TIMESTAMP(3),
ADD COLUMN     "emailChangeToken" TEXT,
ADD COLUMN     "interestedCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'English',
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "pendingEmail" TEXT,
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "preferredStates" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "qualification" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- AlterTable
ALTER TABLE "NotificationPreference" ADD COLUMN     "digestFrequency" TEXT NOT NULL DEFAULT 'INSTANT',
ADD COLUMN     "emailDeadlineAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailReviewAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailRoleAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailSecurityAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsDeadlineAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsReviewAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsRoleAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsSecurityAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegramAdmitCardAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegramAnswerKeyAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegramDeadlineAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegramGeneralAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegramJobAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegramResultAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegramReviewAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegramRoleAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegramSecurityAlerts" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "device" TEXT NOT NULL DEFAULT 'Unknown device',
    "ip" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "device" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneVerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_userId_lastActiveAt_idx" ON "UserSession"("userId", "lastActiveAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_userId_idx" ON "LoginAttempt"("userId");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_idx" ON "LoginAttempt"("email");

-- CreateIndex
CREATE INDEX "LoginAttempt_createdAt_idx" ON "LoginAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "PhoneVerificationCode_userId_idx" ON "PhoneVerificationCode"("userId");

-- CreateIndex
CREATE INDEX "PhoneVerificationCode_userId_createdAt_idx" ON "PhoneVerificationCode"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PhoneVerificationCode_expiresAt_idx" ON "PhoneVerificationCode"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailChangeToken_key" ON "User"("emailChangeToken");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhoneVerificationCode" ADD CONSTRAINT "PhoneVerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
