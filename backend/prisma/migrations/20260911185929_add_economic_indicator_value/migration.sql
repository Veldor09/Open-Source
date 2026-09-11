-- CreateTable
CREATE TABLE "EconomicIndicatorValue" (
    "id" TEXT NOT NULL,
    "indicatorCode" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EconomicIndicatorValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EconomicIndicatorValue_indicatorCode_idx" ON "EconomicIndicatorValue"("indicatorCode");

-- CreateIndex
CREATE UNIQUE INDEX "EconomicIndicatorValue_indicatorCode_fecha_key" ON "EconomicIndicatorValue"("indicatorCode", "fecha");
