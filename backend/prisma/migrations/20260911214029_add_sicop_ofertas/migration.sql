-- AlterTable
ALTER TABLE "SicopImport" ADD COLUMN     "ofertasCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SicopOferta" (
    "nroOferta" TEXT NOT NULL,
    "nroSicop" TEXT NOT NULL,
    "cedulaProveedor" TEXT NOT NULL,
    "fechaPresentacion" TIMESTAMP(3) NOT NULL,
    "tipoOferta" TEXT NOT NULL,
    "idConsorcio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SicopOferta_pkey" PRIMARY KEY ("nroOferta")
);

-- CreateIndex
CREATE INDEX "SicopOferta_nroSicop_idx" ON "SicopOferta"("nroSicop");

-- CreateIndex
CREATE INDEX "SicopOferta_cedulaProveedor_idx" ON "SicopOferta"("cedulaProveedor");

-- CreateIndex
CREATE INDEX "SicopOferta_fechaPresentacion_idx" ON "SicopOferta"("fechaPresentacion");
