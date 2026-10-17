CREATE TABLE "ContactTicket" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactTicket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactTicket_status_createdAt_idx" ON "ContactTicket"("status", "createdAt");

CREATE INDEX "ContactTicket_topic_createdAt_idx" ON "ContactTicket"("topic", "createdAt");
