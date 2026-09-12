import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { fetchWithRetry } from '../../common/http/fetch-with-retry.js';
import { PrismaClient } from '../../generated/prisma/client.js';
import { findOijCsvResourceForYear } from './ckan/oij-ckan-resource.resolver.js';
import { OIJ_INSTITUTION, OIJ_OFFICIAL_URL, OIJ_SOURCE_KEY } from './oij.constants.js';
import { parseOijCsvBuffer } from './parsing/oij-csv.parser.js';

const FIRST_YEAR = 2015;
/** Límite de parámetros por sentencia en PostgreSQL (65535) / 11 columnas. */
const INSERT_CHUNK_SIZE = 5000;

interface CliArgs {
  years: number[];
  force: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const yearArg = argv.find((a) => a.startsWith('--year='));
  const all = argv.includes('--all');
  const force = argv.includes('--force');

  if (!yearArg && !all) {
    throw new Error(
      'Uso:\n' +
        '  npm run import:oij -- --year=<AAAA> [--force]\n' +
        `  npm run import:oij -- --all [--force]   (importa ${FIRST_YEAR}-actual)`,
    );
  }

  const currentYear = new Date().getUTCFullYear();
  const years = all
    ? Array.from({ length: currentYear - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i)
    : [Number(yearArg!.split('=')[1])];

  for (const year of years) {
    if (!Number.isInteger(year) || year < FIRST_YEAR || year > currentYear) {
      throw new Error(`Año inválido: ${year}. Debe estar entre ${FIRST_YEAR} y ${currentYear}.`);
    }
  }

  return { years, force };
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function importYear(year: number, force: boolean): Promise<void> {
  console.log(`\n[OIJ] Año ${year}: consultando CKAN...`);
  const resource = await findOijCsvResourceForYear(year);
  console.log(`[OIJ] Año ${year}: recurso encontrado (${resource.id}), descargando...`);

  const response = await fetchWithRetry(resource.url, { timeoutMs: 120_000 });
  if (!response.ok) {
    throw new Error(`Descarga falló: HTTP ${response.status} ${response.statusText} (${resource.url})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const checksum = createHash('sha256').update(buffer).digest('hex');

  const previous = await prisma.oijImport.findUnique({ where: { anio: year } });
  if (previous && previous.checksum === checksum && !force) {
    console.log(
      `[OIJ] Año ${year}: sin cambios respecto a la última importación (${previous.importedAt.toISOString()}). Se omite (usar --force para reimportar).`,
    );
    return;
  }

  console.log(`[OIJ] Año ${year}: parseando CSV (${(buffer.length / 1024).toFixed(0)} KB)...`);
  const { rows, rowCount, unexpectedSpacerCount, repairedEmbeddedCommaCount } = await parseOijCsvBuffer(buffer);

  if (repairedEmbeddedCommaCount > 0) {
    console.log(
      `[OIJ] Año ${year}: ${repairedEmbeddedCommaCount} fila(s) con Nacionalidad reconstruida (coma sin escapar en la fuente).`,
    );
  }
  if (unexpectedSpacerCount > 0) {
    console.warn(
      `[OIJ] Año ${year}: ADVERTENCIA — ${unexpectedSpacerCount} fila(s) trajeron datos en la columna vacía ` +
        'conocida. El esquema de la fuente pudo haber cambiado; revisar antes de confiar en este import.',
    );
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.oijIncidente.deleteMany({ where: { anio: year } });

      for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
        await tx.oijIncidente.createMany({ data: rows.slice(i, i + INSERT_CHUNK_SIZE) });
      }

      await tx.oijImport.upsert({
        where: { anio: year },
        update: { resourceId: resource.id, resourceUrl: resource.url, checksum, rowCount },
        create: { anio: year, resourceId: resource.id, resourceUrl: resource.url, checksum, rowCount },
      });
    },
    { timeout: 120_000 },
  );

  await prisma.dataSourceStatus.upsert({
    where: { sourceKey: OIJ_SOURCE_KEY },
    update: {
      institution: OIJ_INSTITUTION,
      officialUrl: OIJ_OFFICIAL_URL,
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
      sourceKey: OIJ_SOURCE_KEY,
      institution: OIJ_INSTITUTION,
      officialUrl: OIJ_OFFICIAL_URL,
      resourceUrl: resource.url,
      resourceId: resource.id,
      resourceFormat: resource.format,
      sourceUpdatedAt: new Date(resource.last_modified),
      retrievedAt: new Date(),
      status: 'AVAILABLE',
      checksum,
    },
  });

  console.log(`[OIJ] Año ${year}: ${rowCount} registros importados correctamente.`);
}

async function main(): Promise<void> {
  const { years, force } = parseArgs(process.argv.slice(2));
  let hadError = false;

  for (const year of years) {
    try {
      await importYear(year, force);
    } catch (error) {
      hadError = true;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[OIJ] Año ${year}: FALLÓ — ${message}`);

      await prisma.dataSourceStatus.upsert({
        where: { sourceKey: OIJ_SOURCE_KEY },
        update: { status: 'ERROR', errorMessage: message, retrievedAt: new Date() },
        create: {
          sourceKey: OIJ_SOURCE_KEY,
          institution: OIJ_INSTITUTION,
          officialUrl: OIJ_OFFICIAL_URL,
          status: 'ERROR',
          errorMessage: message,
          retrievedAt: new Date(),
        },
      });
    }
  }

  await prisma.$disconnect();
  if (hadError) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
