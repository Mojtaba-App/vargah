-- CreateTable
CREATE TABLE IF NOT EXISTS "customer_sessions" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "customer_sessions_tokenHash_key" ON "customer_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customer_sessions_subscriberId_idx" ON "customer_sessions"("subscriberId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customer_sessions_expiresAt_idx" ON "customer_sessions"("expiresAt");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
