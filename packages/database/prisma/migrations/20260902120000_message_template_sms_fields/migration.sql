-- AlterTable
ALTER TABLE "message_templates" ADD COLUMN IF NOT EXISTS "externalTemplateId" TEXT;
ALTER TABLE "message_templates" ADD COLUMN IF NOT EXISTS "variables" TEXT[] DEFAULT ARRAY[]::TEXT[];
