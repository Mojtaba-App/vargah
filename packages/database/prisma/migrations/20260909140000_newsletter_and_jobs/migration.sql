-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "NewsletterStatus" AS ENUM ('PENDING', 'ACTIVE', 'UNSUBSCRIBED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BackgroundJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'DEAD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "newsletter_subscriptions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "NewsletterStatus" NOT NULL DEFAULT 'ACTIVE',
    "confirmToken" TEXT,
    "unsubscribeToken" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "source" TEXT,
    "consentIp" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscriptions_email_key" ON "newsletter_subscriptions"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscriptions_confirmToken_key" ON "newsletter_subscriptions"("confirmToken");
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscriptions_unsubscribeToken_key" ON "newsletter_subscriptions"("unsubscribeToken");
CREATE INDEX IF NOT EXISTS "newsletter_subscriptions_status_createdAt_idx" ON "newsletter_subscriptions"("status", "createdAt");

CREATE TABLE IF NOT EXISTS "background_jobs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "BackgroundJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "background_jobs_status_runAfter_idx" ON "background_jobs"("status", "runAfter");
CREATE INDEX IF NOT EXISTS "background_jobs_type_status_idx" ON "background_jobs"("type", "status");

-- Migrate legacy newsletter Messages into subscriptions
INSERT INTO "newsletter_subscriptions" ("id", "email", "status", "unsubscribeToken", "confirmedAt", "source", "createdAt", "updatedAt")
SELECT
  md5(m."senderEmail" || '-newsletter') ,
  lower(m."senderEmail"),
  'ACTIVE'::"NewsletterStatus",
  md5(m."senderEmail" || '-unsub-' || m."id"),
  m."createdAt",
  'legacy-message',
  m."createdAt",
  CURRENT_TIMESTAMP
FROM "messages" m
WHERE m."subject" = 'عضویت خبرنامه'
  AND m."senderEmail" IS NOT NULL
  AND m."senderEmail" <> ''
ON CONFLICT ("email") DO NOTHING;
