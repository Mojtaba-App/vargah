-- Iran cities reference + subscriber city link (GIS phase 1)

CREATE TABLE "iran_cities" (
    "id" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "iran_cities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "iran_cities_province_name_key" ON "iran_cities"("province", "name");
CREATE INDEX "iran_cities_province_idx" ON "iran_cities"("province");

ALTER TABLE "subscribers" ADD COLUMN "cityId" TEXT;

CREATE INDEX "subscribers_cityId_idx" ON "subscribers"("cityId");
CREATE INDEX "subscribers_status_cityId_idx" ON "subscribers"("status", "cityId");

ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "iran_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
