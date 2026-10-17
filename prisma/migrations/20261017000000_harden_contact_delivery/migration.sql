ALTER TABLE "ContactTicket"
  ADD COLUMN "notifiedAt" TIMESTAMP(3),
  ADD COLUMN "autoRepliedAt" TIMESTAMP(3),
  ADD COLUMN "deliveryAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing tickets predate the durable delivery queue; do not re-send old mail.
UPDATE "ContactTicket" SET "notifiedAt" = "createdAt", "autoRepliedAt" = "createdAt";
CREATE INDEX "ContactTicket_nextAttemptAt_idx" ON "ContactTicket"("nextAttemptAt");

CREATE TABLE "ContactRateLimit" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "ContactRateLimit_expiresAt_idx" ON "ContactRateLimit"("expiresAt");
