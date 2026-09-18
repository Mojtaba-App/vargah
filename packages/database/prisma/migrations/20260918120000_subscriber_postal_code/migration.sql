-- Postal code for physical magazine delivery
ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
