/*
  Warnings:

  - You are about to drop the `EconomicIndicatorValue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "EconomicIndicatorValue";

-- CreateTable
CREATE TABLE "SicopProcedimiento" (
    "nroSicop" TEXT NOT NULL,
    "cedulaInstitucion" TEXT NOT NULL,
    "numeroProcedimiento" TEXT NOT NULL,
    "tipoProcedimiento" TEXT NOT NULL,
    "modalidadProcedimiento" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "clasificacionObjeto" TEXT,
    "montoEstimado" DOUBLE PRECISION,
    "fechaPublicacion" TIMESTAMP(3) NOT NULL,
    "fechaApertura" TIMESTAMP(3),
    "fechaModificacion" TIMESTAMP(3),
    "codigoExcepcion" TEXT,
    "descripcionExcepcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SicopProcedimiento_pkey" PRIMARY KEY ("nroSicop")
);

-- CreateTable
CREATE TABLE "SicopLineaAdjudicada" (
    "id" TEXT NOT NULL,
    "nroSicop" TEXT NOT NULL,
    "linea" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "cedulaInstitucion" TEXT NOT NULL,
    "institucion" TEXT NOT NULL,
    "numeroProcedimiento" TEXT NOT NULL,
    "tipoProcedimiento" TEXT NOT NULL,
    "modalidadProcedimiento" TEXT NOT NULL,
    "descripcionProcedimiento" TEXT NOT NULL,
    "descripcionBienServicio" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "montoUnitario" DOUBLE PRECISION NOT NULL,
    "monedaPrecioEstimado" TEXT NOT NULL,
    "monedaAdjudicada" TEXT NOT NULL,
    "montoLineaAdjudicada" DOUBLE PRECISION NOT NULL,
    "montoLineaAdjudicadaCrc" DOUBLE PRECISION,
    "montoLineaAdjudicadaUsd" DOUBLE PRECISION,
    "fechaAdjudicacionFirme" TIMESTAMP(3),
    "fechaSolicitudContrato" TIMESTAMP(3),
    "cedulaProveedor" TEXT NOT NULL,
    "nombreProveedor" TEXT NOT NULL,
    "perfilProveedor" TEXT,
    "objetoGasto" TEXT,
    "productoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SicopLineaAdjudicada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SicopInstitucion" (
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "zonaGeografica" TEXT,
    "fechaIngreso" TIMESTAMP(3),
    "fechaModificacion" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SicopInstitucion_pkey" PRIMARY KEY ("cedula")
);

-- CreateTable
CREATE TABLE "SicopProveedor" (
    "cedula" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoProveedor" TEXT,
    "tamanoProveedor" TEXT,
    "zonaGeografica" TEXT,
    "fechaRegistro" TIMESTAMP(3),
    "fechaModificacion" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SicopProveedor_pkey" PRIMARY KEY ("cedula")
);

-- CreateTable
CREATE TABLE "SicopImport" (
    "id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "procedimientosCount" INTEGER NOT NULL,
    "lineasAdjudicadasCount" INTEGER NOT NULL,
    "institucionesCount" INTEGER NOT NULL,
    "proveedoresCount" INTEGER NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SicopImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SicopProcedimiento_tipoProcedimiento_idx" ON "SicopProcedimiento"("tipoProcedimiento");

-- CreateIndex
CREATE INDEX "SicopProcedimiento_modalidadProcedimiento_idx" ON "SicopProcedimiento"("modalidadProcedimiento");

-- CreateIndex
CREATE INDEX "SicopProcedimiento_estado_idx" ON "SicopProcedimiento"("estado");

-- CreateIndex
CREATE INDEX "SicopProcedimiento_clasificacionObjeto_idx" ON "SicopProcedimiento"("clasificacionObjeto");

-- CreateIndex
CREATE INDEX "SicopProcedimiento_cedulaInstitucion_idx" ON "SicopProcedimiento"("cedulaInstitucion");

-- CreateIndex
CREATE INDEX "SicopProcedimiento_fechaPublicacion_idx" ON "SicopProcedimiento"("fechaPublicacion");

-- CreateIndex
CREATE INDEX "SicopLineaAdjudicada_cedulaInstitucion_idx" ON "SicopLineaAdjudicada"("cedulaInstitucion");

-- CreateIndex
CREATE INDEX "SicopLineaAdjudicada_cedulaProveedor_idx" ON "SicopLineaAdjudicada"("cedulaProveedor");

-- CreateIndex
CREATE INDEX "SicopLineaAdjudicada_anio_idx" ON "SicopLineaAdjudicada"("anio");

-- CreateIndex
CREATE INDEX "SicopLineaAdjudicada_fechaAdjudicacionFirme_idx" ON "SicopLineaAdjudicada"("fechaAdjudicacionFirme");

-- CreateIndex
CREATE INDEX "SicopLineaAdjudicada_monedaAdjudicada_idx" ON "SicopLineaAdjudicada"("monedaAdjudicada");

-- CreateIndex
CREATE INDEX "SicopLineaAdjudicada_tipoProcedimiento_idx" ON "SicopLineaAdjudicada"("tipoProcedimiento");

-- CreateIndex
CREATE INDEX "SicopLineaAdjudicada_modalidadProcedimiento_idx" ON "SicopLineaAdjudicada"("modalidadProcedimiento");

-- CreateIndex
CREATE UNIQUE INDEX "SicopLineaAdjudicada_nroSicop_linea_key" ON "SicopLineaAdjudicada"("nroSicop", "linea");

-- CreateIndex
CREATE UNIQUE INDEX "SicopImport_periodo_key" ON "SicopImport"("periodo");
