-- CreateEnum
CREATE TYPE "DiscountCodeType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "DiscountCodeScope" AS ENUM ('ALL', 'SELECTED');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "discountCode" TEXT,
ADD COLUMN "discountAmount" DECIMAL(12,0),
ADD COLUMN "subtotalAmount" DECIMAL(12,0);

-- CreateTable
CREATE TABLE "discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountCodeType" NOT NULL,
    "value" INTEGER NOT NULL,
    "scope" "DiscountCodeScope" NOT NULL DEFAULT 'ALL',
    "planSlugs" TEXT[],
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "maxUsesPerUser" INTEGER DEFAULT 1,
    "minSubtotal" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_redemptions" (
    "id" TEXT NOT NULL,
    "discountCodeId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "codeSnapshot" TEXT NOT NULL,
    "amountOff" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX "discount_codes_isActive_endsAt_idx" ON "discount_codes"("isActive", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "discount_redemptions_paymentId_key" ON "discount_redemptions"("paymentId");

-- CreateIndex
CREATE INDEX "discount_redemptions_subscriberId_discountCodeId_idx" ON "discount_redemptions"("subscriberId", "discountCodeId");

-- AddForeignKey
ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "discount_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
