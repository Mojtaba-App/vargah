CREATE TABLE IF NOT EXISTS "admin_alert_acks" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "alertKey" TEXT NOT NULL,
  "seenCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "admin_alert_acks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_alert_acks_userId_alertKey_key"
  ON "admin_alert_acks"("userId", "alertKey");

CREATE INDEX IF NOT EXISTS "admin_alert_acks_userId_idx"
  ON "admin_alert_acks"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_alert_acks_userId_fkey'
  ) THEN
    ALTER TABLE "admin_alert_acks"
      ADD CONSTRAINT "admin_alert_acks_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
