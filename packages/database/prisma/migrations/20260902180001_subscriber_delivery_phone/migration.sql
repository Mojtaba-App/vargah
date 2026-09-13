-- Delivery contact separate from account phone (run after NONE enum exists)
ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "deliveryPhone" TEXT;

UPDATE "subscribers" s
SET "status" = 'NONE'
WHERE s."status" = 'PENDING_PAYMENT'
  AND s."planType" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "payments" p WHERE p."subscriberId" = s."id"
  );

UPDATE "subscribers"
SET "deliveryPhone" = "phone"
WHERE "address" IS NOT NULL
  AND "deliveryPhone" IS NULL;

ALTER TABLE "subscribers" ALTER COLUMN "status" SET DEFAULT 'NONE';
