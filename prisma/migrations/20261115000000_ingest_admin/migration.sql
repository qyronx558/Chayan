-- Content bot controls (Admin → Content bot)
CREATE TABLE "IngestSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "centralEnabled" BOOLEAN NOT NULL DEFAULT true,
    "stateEnabled" BOOLEAN NOT NULL DEFAULT true,
    "districtEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "autoApproveDailyCap" INTEGER NOT NULL DEFAULT 60,
    "minScore" INTEGER NOT NULL DEFAULT 75,
    "minConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "maxNewPerSource" INTEGER NOT NULL DEFAULT 15,
    "maxLlmCalls" INTEGER NOT NULL DEFAULT 120,
    "geminiModel" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "IngestSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IngestSource" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "custom" BOOLEAN NOT NULL DEFAULT false,
    "def" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "IngestSource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IngestSource_custom_idx" ON "IngestSource"("custom");
