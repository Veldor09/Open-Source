-- CreateTable
CREATE TABLE "TsePadronSnapshot" (
    "id" TEXT NOT NULL,
    "fechaSnapshot" DATE NOT NULL,
    "provincia" TEXT NOT NULL,
    "canton" TEXT NOT NULL,
    "distrito" TEXT NOT NULL,
    "cantidadElectores" INTEGER NOT NULL,

    CONSTRAINT "TsePadronSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TsePadronSnapshot_fechaSnapshot_idx" ON "TsePadronSnapshot"("fechaSnapshot");

-- CreateIndex
CREATE INDEX "TsePadronSnapshot_provincia_idx" ON "TsePadronSnapshot"("provincia");

-- CreateIndex
CREATE UNIQUE INDEX "TsePadronSnapshot_fechaSnapshot_provincia_canton_distrito_key" ON "TsePadronSnapshot"("fechaSnapshot", "provincia", "canton", "distrito");
