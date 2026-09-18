-- Customer-facing read state for support replies
ALTER TABLE "ticket_replies" ADD COLUMN IF NOT EXISTS "customerReadAt" TIMESTAMP(3);
