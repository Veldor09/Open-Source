-- CreateTable
CREATE TABLE "OijIncidente" (
    "id" TEXT NOT NULL,
    "delito" TEXT NOT NULL,
    "subDelito" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "anio" INTEGER NOT NULL,
    "victima" TEXT NOT NULL,
    "subVictima" TEXT NOT NULL,
    "edad" TEXT NOT NULL,
    "nacionalidad" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "canton" TEXT NOT NULL,
    "distrito" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OijIncidente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OijImport" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceUrl" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OijImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OijIncidente_fecha_idx" ON "OijIncidente"("fecha");

-- CreateIndex
CREATE INDEX "OijIncidente_anio_idx" ON "OijIncidente"("anio");

-- CreateIndex
CREATE INDEX "OijIncidente_delito_idx" ON "OijIncidente"("delito");

-- CreateIndex
CREATE INDEX "OijIncidente_provincia_idx" ON "OijIncidente"("provincia");

-- CreateIndex
CREATE INDEX "OijIncidente_canton_idx" ON "OijIncidente"("canton");

-- CreateIndex
CREATE UNIQUE INDEX "OijImport_anio_key" ON "OijImport"("anio");
