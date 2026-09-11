import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import * as yauzl from 'yauzl';
import { fetchWithRetry } from '../../common/http/fetch-with-retry.js';
import { SchemaMismatchError } from '../../common/errors/schema-mismatch.error.js';
import { PrismaClient } from '../../generated/prisma/client.js';
import { parseDetalleCartelesCsv } from './parsing/detalle-carteles.parser.js';
import { parseInstitucionesRegistradasCsv } from './parsing/instituciones-registradas.parser.js';
import { parseOfertasCsv } from './parsing/ofertas.parser.js';
import { parseProcedimientoAdjudicacionCsv } from './parsing/procedimiento-adjudicacion.parser.js';
import { parseProveedoresCsv } from './parsing/proveedores.parser.js';
import {
  DETALLE_CARTELES_ENTRY,
  INSTITUCIONES_REGISTRADAS_ENTRY,
  OFERTAS_ENTRY,
  PROCEDIMIENTO_ADJUDICACION_ENTRY,
  PROVEEDORES_ENTRY,
  SICOP_FIRST_PERIOD,
  SICOP_INSTITUTION,
  SICOP_OFFICIAL_URL,
  SICOP_SOURCE_KEY,
  buildSicopZipUrl,
  currentPeriodo,
  isValidPeriodo,
} from './sicop.constants.js';

const UPSERT_CHUNK_SIZE = 200;
const CREATE_CHUNK_SIZE = 5000;

interface CliArgs {
  periodos: string[];
  force: boolean;
}

function generatePeriodoRange(desde: string, hasta: string): string[] {
  const periodos: string[] = [];
  let year = Number(desde.slice(0, 4));
  let month = Number(desde.slice(4, 6));
  const hastaNum = Number(hasta);

  while (Number(`${year}${String(month).padStart(2, '0')}`) <= hastaNum) {
    periodos.push(`${year}${String(month).padStart(2, '0')}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return periodos;
}

function parseArgs(argv: string[]): CliArgs {
  const periodoArg = argv.find((a) => a.startsWith('--periodo='))?.split('=')[1];
  const desdeArg = argv.find((a) => a.startsWith('--desde='))?.split('=')[1];
  const force = argv.includes('--force');

  if (periodoArg && desdeArg) {
    throw new Error('Usar --periodo=AAAAMM o --desde=AAAAMM, no ambos.');
  }

  const hasta = currentPeriodo();
  const periodos = periodoArg ? [periodoArg] : desdeArg ? generatePeriodoRange(desdeArg, hasta) : [hasta];

  for (const periodo of periodos) {
    if (!isValidPeriodo(periodo)) {
      throw new Error(
        `Período inválido: "${periodo}". Debe tener formato AAAAMM, mes 01-12, y ser >= ${SICOP_FIRST_PERIOD}.\n` +
          'Uso:\n' +
          '  npm run import:sicop -- [--periodo=AAAAMM] [--force]   (por defecto, el mes actual)\n' +
          '  npm run import:sicop -- --desde=AAAAMM [--force]        (desde ese mes hasta el actual)',
      );
    }
  }

  return { periodos, force };
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function importPeriodo(periodo: string, force: boolean): Promise<void> {
  const url = buildSicopZipUrl(periodo);
  console.log(`\n[SICOP] Período ${periodo}: descargando ${url}...`);

  const response = await fetchWithRetry(url, { timeoutMs: 3 * 60_000 });
  if (!response.ok) {
    throw new Error(`Descarga falló: HTTP ${response.status} ${response.statusText} (${url})`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error(`El archivo descargado no es un ZIP válido (no empieza con "PK"). ¿Cambió la URL/formato de ${url}?`);
  }

  const checksum = createHash('sha256').update(buffer).digest('hex');
  const previous = await prisma.sicopImport.findUnique({ where: { periodo } });
  if (previous?.checksum === checksum && !force) {
    console.log(
      `[SICOP] Período ${periodo}: sin cambios desde la última importación (${previous.importedAt.toISOString()}). Se omite (usar --force para reimportar).`,
    );
    return;
  }

  console.log(`[SICOP] Período ${periodo}: ZIP válido (${(buffer.length / 1024 / 1024).toFixed(1)} MB), leyendo índice...`);
  const zipfile = await yauzl.fromBufferPromise(buffer, { lazyEntries: true, autoClose: false });
  const entries: yauzl.Entry[] = [];
  for await (const entry of zipfile.eachEntry()) {
    entries.push(entry);
  }

  const findEntry = (name: string) => entries.find((e) => e.fileName === name);
  const detalleCartelesEntry = findEntry(DETALLE_CARTELES_ENTRY);
  const procedimientoAdjudicacionEntry = findEntry(PROCEDIMIENTO_ADJUDICACION_ENTRY);
  const institucionesEntry = findEntry(INSTITUCIONES_REGISTRADAS_ENTRY);
  const proveedoresEntry = findEntry(PROVEEDORES_ENTRY);
  const ofertasEntry = findEntry(OFERTAS_ENTRY);

  if (
    !detalleCartelesEntry ||
    !procedimientoAdjudicacionEntry ||
    !institucionesEntry ||
    !proveedoresEntry ||
    !ofertasEntry
  ) {
    throw new SchemaMismatchError(
      `El ZIP de ${periodo} no contiene los 5 archivos esperados. Encontrados: ${entries.map((e) => e.fileName).join(', ')}`,
    );
  }

  console.log('[SICOP] Parseando DetalleCarteles.csv...');
  const procedimientos = await parseDetalleCartelesCsv(
    await streamToString(await zipfile.openReadStreamPromise(detalleCartelesEntry)),
  );
  console.log(`[SICOP]   ${procedimientos.length} procedimientos.`);

  console.log('[SICOP] Parseando ProcedimientoAdjudicacion.csv...');
  const lineas = await parseProcedimientoAdjudicacionCsv(
    await streamToString(await zipfile.openReadStreamPromise(procedimientoAdjudicacionEntry)),
  );
  console.log(`[SICOP]   ${lineas.length} líneas adjudicadas.`);

  console.log('[SICOP] Parseando InstitucionesRegistradas.csv...');
  const instituciones = await parseInstitucionesRegistradasCsv(
    await streamToString(await zipfile.openReadStreamPromise(institucionesEntry)),
  );
  console.log(`[SICOP]   ${instituciones.length} instituciones.`);

  console.log('[SICOP] Parseando Proveedores.csv...');
  const proveedores = await parseProveedoresCsv(await streamToString(await zipfile.openReadStreamPromise(proveedoresEntry)));
  console.log(`[SICOP]   ${proveedores.length} proveedores.`);

  console.log('[SICOP] Parseando Ofertas.csv...');
  const ofertas = await parseOfertasCsv(await streamToString(await zipfile.openReadStreamPromise(ofertasEntry)));
  console.log(`[SICOP]   ${ofertas.length} ofertas.`);

  zipfile.close();

  console.log('[SICOP] Escribiendo en base de datos...');
  await prisma.$transaction(
    async (tx) => {
      // InstitucionesRegistradas.csv y Proveedores.csv son una foto completa del
      // registro vigente (se ven instituciones/proveedores registrados desde
      // 2010-2020 en un ZIP de agosto 2026) — se reemplaza la tabla completa en
      // vez de hacer upsert fila por fila.
      await tx.sicopInstitucion.deleteMany({});
      for (let i = 0; i < instituciones.length; i += CREATE_CHUNK_SIZE) {
        await tx.sicopInstitucion.createMany({ data: instituciones.slice(i, i + CREATE_CHUNK_SIZE) });
      }

      await tx.sicopProveedor.deleteMany({});
      for (let i = 0; i < proveedores.length; i += CREATE_CHUNK_SIZE) {
        await tx.sicopProveedor.createMany({ data: proveedores.slice(i, i + CREATE_CHUNK_SIZE) });
      }

      // DetalleCarteles.csv y ProcedimientoAdjudicacion.csv NO se reemplazan
      // por completo: se verificó que un solo ZIP mensual (202608) ya trae
      // adjudicaciones en firme con fechas desde enero 2026, no solo agosto —
      // es decir, no es una ventana estrictamente acotada a "ese mes". Se hace
      // upsert por clave natural (NRO_SICOP / NRO_SICOP+LINEA) para acumular
      // sin perder historial sin importar cómo varíe esa ventana entre meses.
      for (let i = 0; i < procedimientos.length; i += UPSERT_CHUNK_SIZE) {
        const chunk = procedimientos.slice(i, i + UPSERT_CHUNK_SIZE);
        await Promise.all(
          chunk.map((row) =>
            tx.sicopProcedimiento.upsert({
              where: { nroSicop: row.nroSicop },
              update: row,
              create: row,
            }),
          ),
        );
      }

      for (let i = 0; i < lineas.length; i += UPSERT_CHUNK_SIZE) {
        const chunk = lineas.slice(i, i + UPSERT_CHUNK_SIZE);
        await Promise.all(
          chunk.map((row) =>
            tx.sicopLineaAdjudicada.upsert({
              where: { nroSicop_linea: { nroSicop: row.nroSicop, linea: row.linea } },
              update: row,
              create: row,
            }),
          ),
        );
      }

      // Ofertas.csv es distinto a los 4 anteriores: cada fila es un evento
      // inmutable con su propia llave natural (NRO_OFERTA, verificado único
      // en todo el archivo) — nunca se "actualiza" una oferta ya presentada,
      // así que se inserta una sola vez con createMany + skipDuplicates en
      // vez de upsert fila por fila (más simple y más rápido para un
      // volumen de decenas de miles de filas por mes).
      for (let i = 0; i < ofertas.length; i += CREATE_CHUNK_SIZE) {
        await tx.sicopOferta.createMany({ data: ofertas.slice(i, i + CREATE_CHUNK_SIZE), skipDuplicates: true });
      }

      await tx.sicopImport.upsert({
        where: { periodo },
        update: {
          checksum,
          procedimientosCount: procedimientos.length,
          lineasAdjudicadasCount: lineas.length,
          institucionesCount: instituciones.length,
          proveedoresCount: proveedores.length,
          ofertasCount: ofertas.length,
        },
        create: {
          periodo,
          checksum,
          procedimientosCount: procedimientos.length,
          lineasAdjudicadasCount: lineas.length,
          institucionesCount: instituciones.length,
          proveedoresCount: proveedores.length,
          ofertasCount: ofertas.length,
        },
      });
    },
    { timeout: 5 * 60_000 },
  );

  await prisma.dataSourceStatus.upsert({
    where: { sourceKey: SICOP_SOURCE_KEY },
    update: {
      institution: SICOP_INSTITUTION,
      officialUrl: SICOP_OFFICIAL_URL,
      resourceUrl: url,
      resourceFormat: 'ZIP',
      sourceUpdatedAt: new Date(),
      retrievedAt: new Date(),
      status: 'AVAILABLE',
      errorMessage: null,
      checksum,
    },
    create: {
      sourceKey: SICOP_SOURCE_KEY,
      institution: SICOP_INSTITUTION,
      officialUrl: SICOP_OFFICIAL_URL,
      resourceUrl: url,
      resourceFormat: 'ZIP',
      sourceUpdatedAt: new Date(),
      retrievedAt: new Date(),
      status: 'AVAILABLE',
      checksum,
    },
  });

  console.log(`[SICOP] Período ${periodo}: listo.`);
}

async function main(): Promise<void> {
  const { periodos, force } = parseArgs(process.argv.slice(2));
  let hadError = false;

  for (const periodo of periodos) {
    try {
      await importPeriodo(periodo, force);
    } catch (error) {
      hadError = true;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[SICOP] Período ${periodo}: FALLÓ — ${message}`);

      await prisma.dataSourceStatus.upsert({
        where: { sourceKey: SICOP_SOURCE_KEY },
        update: { status: 'ERROR', errorMessage: message, retrievedAt: new Date() },
        create: {
          sourceKey: SICOP_SOURCE_KEY,
          institution: SICOP_INSTITUTION,
          officialUrl: SICOP_OFFICIAL_URL,
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
