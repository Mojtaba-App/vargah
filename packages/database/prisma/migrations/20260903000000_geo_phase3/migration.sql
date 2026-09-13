-- AlterTable
ALTER TABLE "advertisers" ADD COLUMN "cityId" TEXT;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN "province" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "cityId" TEXT;

-- CreateIndex
CREATE INDEX "advertisers_cityId_idx" ON "advertisers"("cityId");

-- CreateIndex
CREATE INDEX "messages_cityId_idx" ON "messages"("cityId");

-- AddForeignKey
ALTER TABLE "advertisers" ADD CONSTRAINT "advertisers_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "iran_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "iran_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
