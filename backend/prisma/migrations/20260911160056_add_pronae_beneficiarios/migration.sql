-- CreateTable
CREATE TABLE "PronaeBeneficiario" (
    "id" TEXT NOT NULL,
    "modalidad" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "PronaeBeneficiario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PronaeBeneficiario_anio_idx" ON "PronaeBeneficiario"("anio");

-- CreateIndex
CREATE UNIQUE INDEX "PronaeBeneficiario_modalidad_anio_key" ON "PronaeBeneficiario"("modalidad", "anio");
