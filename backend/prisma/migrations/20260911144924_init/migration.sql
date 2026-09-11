-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('AVAILABLE', 'STALE', 'UNAVAILABLE', 'NOT_CONFIGURED', 'IMPORTING', 'ERROR');

-- CreateTable
CREATE TABLE "DataSourceStatus" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "officialUrl" TEXT NOT NULL,
    "resourceUrl" TEXT,
    "resourceId" TEXT,
    "resourceFormat" TEXT,
    "sourceUpdatedAt" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3),
    "status" "SourceStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "errorMessage" TEXT,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSourceStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataSourceStatus_sourceKey_key" ON "DataSourceStatus"("sourceKey");
