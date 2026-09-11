import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import * as XLSX from 'xlsx';
import { ckanPackageShow } from '../../common/ckan/ckan-client.js';
import { fetchWithRetry } from '../../common/http/fetch-with-retry.js';
import { PrismaClient } from '../../generated/prisma/client.js';
import {
  PORTAL_CKAN_BASE_URL,
  PORTAL_INSTITUTION,
  PORTAL_OFFICIAL_URL,
  PORTAL_SOURCE_KEY,
  PRONAE_PACKAGE_ID,
} from './portal-datos.constants.js';
import { parsePronaeSheet } from './parsing/pronae-xlsx.parser.js';

const force = process.argv.includes('--force');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('[PRONAE] Consultando CKAN...');
  const pkg = await ckanPackageShow(PORTAL_CKAN_BASE_URL, PRONAE_PACKAGE_ID);

  const resource = pkg.resources.find((r) => r.format.toUpperCase() === 'XLSX');
  if (!resource) {
    throw new Error(
      `No se encontró un recurso XLSX en el dataset "${PRONAE_PACKAGE_ID}". ` +
        `Formatos disponibles: ${pkg.resources.map((r) => r.format).join(', ') || '(ninguno)'}`,
    );
  }

  console.log(`[PRONAE] Recurso encontrado (${resource.id}), descargando...`);
  const response = await fetchWithRetry(resource.url, { timeoutMs: 60_000 });
  if (!response.ok) {
    throw new Error(`Descarga falló: HTTP ${response.status} ${response.statusText} (${resource.url})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const checksum = createHash('sha256').update(buffer).digest('hex');

  const previous = await prisma.dataSourceStatus.findUnique({ where: { sourceKey: PORTAL_SOURCE_KEY } });
  if (previous?.checksum === checksum && !force) {
    console.log(
      `[PRONAE] Sin cambios respecto a la última importación (${previous.retrievedAt?.toISOString()}). ` +
        'Se omite (usar --force para reimportar).',
    );
    await prisma.$disconnect();
    return;
  }

  console.log('[PRONAE] Leyendo XLSX...');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  if (workbook.SheetNames.length === 0) {
    throw new Error('El XLSX del PRONAE no tiene hojas.');
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]!]!;
  const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '' });

  const { rows, totalMismatches } = parsePronaeSheet(rawRows);

  if (totalMismatches.length > 0) {
    console.warn(
      `[PRONAE] ADVERTENCIA — la fila "Total" de la fuente no cuadra con la suma de modalidades en: ` +
        totalMismatches.map((m) => `${m.anio} (declarado ${m.declarado}, calculado ${m.calculado})`).join(', '),
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      await tx.pronaeBeneficiario.upsert({
        where: { modalidad_anio: { modalidad: row.modalidad, anio: row.anio } },
        update: { cantidad: row.cantidad },
        create: row,
      });
    }
  });

  await prisma.dataSourceStatus.upsert({
    where: { sourceKey: PORTAL_SOURCE_KEY },
    update: {
      institution: PORTAL_INSTITUTION,
      officialUrl: PORTAL_OFFICIAL_URL,
      resourceUrl: resource.url,
      resourceId: resource.id,
      resourceFormat: resource.format,
      sourceUpdatedAt: new Date(resource.last_modified),
      retrievedAt: new Date(),
      status: 'AVAILABLE',
      errorMessage: null,
      checksum,
    },
    create: {
      sourceKey: PORTAL_SOURCE_KEY,
      institution: PORTAL_INSTITUTION,
      officialUrl: PORTAL_OFFICIAL_URL,
      resourceUrl: resource.url,
      resourceId: resource.id,
      resourceFormat: resource.format,
      sourceUpdatedAt: new Date(resource.last_modified),
      retrievedAt: new Date(),
      status: 'AVAILABLE',
      checksum,
    },
  });

  console.log(`[PRONAE] ${rows.length} registros (modalidad x año) importados correctamente.`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('[PRONAE] FALLÓ —', error instanceof Error ? error.message : error);
  await prisma.dataSourceStatus.upsert({
    where: { sourceKey: PORTAL_SOURCE_KEY },
    update: { status: 'ERROR', errorMessage: String(error), retrievedAt: new Date() },
    create: {
      sourceKey: PORTAL_SOURCE_KEY,
      institution: PORTAL_INSTITUTION,
      officialUrl: PORTAL_OFFICIAL_URL,
      status: 'ERROR',
      errorMessage: String(error),
      retrievedAt: new Date(),
    },
  });
  await prisma.$disconnect();
  process.exit(1);
});
