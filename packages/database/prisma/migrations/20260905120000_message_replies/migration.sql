-- CreateTable
CREATE TABLE "message_replies" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_replies_messageId_idx" ON "message_replies"("messageId");

-- CreateIndex
CREATE INDEX "message_replies_createdAt_idx" ON "message_replies"("createdAt");

-- AddForeignKey
ALTER TABLE "message_replies" ADD CONSTRAINT "message_replies_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_replies" ADD CONSTRAINT "message_replies_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "message_templates" ("id", "key", "name", "channel", "subject", "body", "variables", "isActive", "createdAt", "updatedAt")
SELECT
  'cmessagereplytpl0001',
  'message_reply',
  'پاسخ صندوق پیام',
  'EMAIL',
  'پاسخ: {{subject}}',
  E'{{name}} عزیز،\n\n{{body}}\n\nبا تشکر، تیم وارگه',
  ARRAY[]::text[],
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "message_templates" WHERE "key" = 'message_reply'
);
