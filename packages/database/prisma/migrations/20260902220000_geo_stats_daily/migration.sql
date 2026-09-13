-- CreateTable
CREATE TABLE "geo_stats_daily" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "cityId" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "subscribersActive" INTEGER NOT NULL DEFAULT 0,
    "subscribersNew" INTEGER NOT NULL DEFAULT 0,
    "subscribersTotal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geo_stats_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "geo_stats_daily_date_cityId_key" ON "geo_stats_daily"("date", "cityId");

-- CreateIndex
CREATE INDEX "geo_stats_daily_date_idx" ON "geo_stats_daily"("date");

-- CreateIndex
CREATE INDEX "geo_stats_daily_province_date_idx" ON "geo_stats_daily"("province", "date");

-- AddForeignKey
ALTER TABLE "geo_stats_daily" ADD CONSTRAINT "geo_stats_daily_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "iran_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
