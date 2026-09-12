import 'dotenv/config';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import { PrismaPg } from '@prisma/adapter-pg';
import * as yauzl from 'yauzl';
import { fetchWithRetry } from '../../common/http/fetch-with-retry.js';
import { PrismaClient } from '../../generated/prisma/client.js';
import { parseDistelecContent } from './parsing/distelec.parser.js';
import { verifyLeameSchema } from './parsing/leame-schema.validator.js';
import { extractCodelecFromPadronLine } from './parsing/padron-line.mapper.js';
import {
  DISTELEC_ENTRY_PATTERN,
  LEAME_ENTRY_PATTERN,
  PADRON_ENTRY_PATTERN,
  PROVINCIA_DESCONOCIDA,
  CANTON_DESCONOCIDO,
  DISTRITO_DESCONOCIDO,
  TSE_INSTITUTION,
  TSE_OFFICIAL_URL,
  TSE_PADRON_ZIP_URL,
  TSE_SOURCE_KEY,
} from './tse.constants.js';

const force = process.argv.includes('--force');
const fechaCorteArg = process.argv.find((a) => a.startsWith('--fecha-corte='))?.split('=')[1];

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * El TSE no expone la fecha de corte ("actualizado al ...") en ningún
 * archivo descargable ni en una API — solo aparece en texto renderizado por
 * JavaScript en la página de descarga, verificado el 2026-09-11 (un fetch
 * simple del HTML no la trae). Por eso se acepta como parámetro explícito;
 * si no se da, se infiere el último día del mes anterior y se advierte que
 * debe verificarse a mano contra https://www.tse.go.cr/descarga_padron.html
 */
function resolveFechaCorte(): { fecha: Date; inferida: boolean } {
  if (fechaCorteArg) {
    const fecha = new Date(`${fechaCorteArg}T00:00:00Z`);
    if (Number.isNaN(fecha.getTime())) {
      throw new Error(`--fecha-corte inválida: "${fechaCorteArg}". Usar formato AAAA-MM-DD.`);
    }
    return { fecha, inferida: false };
  }

  const now = new Date();
  const lastDayOfPreviousMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  return { fecha: lastDayOfPreviousMonth, inferida: true };
}

async function streamToString(stream: NodeJS.ReadableStream, encoding: BufferEncoding): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString(encoding);
}

async function main(): Promise<void> {
  const { fecha: fechaSnapshot, inferida } = resolveFechaCorte();
  if (inferida) {
    console.warn(
      `[TSE] ADVERTENCIA — no se dio --fecha-corte, se infiere ${fechaSnapshot.toISOString().slice(0, 10)} ` +
        '(último día del mes anterior). Verificar el valor real en https://www.tse.go.cr/descarga_padron.html ' +
        'y volver a importar con --fecha-corte=AAAA-MM-DD --force si no coincide.',
    );
  }

  console.log('[TSE] Descargando padrón completo (~72 MB)...');
  const response = await fetchWithRetry(TSE_PADRON_ZIP_URL, { timeoutMs: 5 * 60_000 });
  if (!response.ok) {
    throw new Error(`Descarga falló: HTTP ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error(
      `El archivo descargado no es un ZIP válido (no empieza con la firma "PK"). ` +
        `¿Cambió la URL o el formato de ${TSE_PADRON_ZIP_URL}?`,
    );
  }

  const checksum = createHash('sha256').update(buffer).digest('hex');
  const previous = await prisma.dataSourceStatus.findUnique({ where: { sourceKey: TSE_SOURCE_KEY } });
  if (previous?.checksum === checksum && !force) {
    console.log(
      `[TSE] Sin cambios respecto a la última importación (${previous.retrievedAt?.toISOString()}). ` +
        'Se omite (usar --force para reimportar).',
    );
    await prisma.$disconnect();
    return;
  }

  console.log(`[TSE] ZIP válido (${(buffer.length / 1024 / 1024).toFixed(1)} MB), leyendo índice...`);
  const zipfile = await yauzl.fromBufferPromise(buffer, { lazyEntries: true, autoClose: false });
  const entries: yauzl.Entry[] = [];
  for await (const entry of zipfile.eachEntry()) {
    entries.push(entry);
  }

  const leameEntry = entries.find((e) => LEAME_ENTRY_PATTERN.test(e.fileName));
  const distelecEntry = entries.find((e) => DISTELEC_ENTRY_PATTERN.test(e.fileName));
  const padronEntry = entries.find((e) => PADRON_ENTRY_PATTERN.test(e.fileName));

  if (!leameEntry || !distelecEntry || !padronEntry) {
    const found = entries.map((e) => e.fileName).join(', ');
    throw new Error(
      `El ZIP no tiene los 3 archivos esperados (leame/distelec/padron_completo). Archivos encontrados: ${found}`,
    );
  }

  console.log('[TSE] Verificando LEAME.txt...');
  const leameText = await streamToString(await zipfile.openReadStreamPromise(leameEntry), 'latin1');
  verifyLeameSchema(leameText);

  console.log('[TSE] Cargando catálogo de distritos (DISTELEC.txt)...');
  const distelecText = await streamToString(await zipfile.openReadStreamPromise(distelecEntry), 'latin1');
  const distelecMap = parseDistelecContent(distelecText);
  console.log(`[TSE] ${distelecMap.size} distritos electorales catalogados.`);

  console.log('[TSE] Procesando padrón completo por streaming (esto toma varios minutos)...');
  const padronStream = await zipfile.openReadStreamPromise(padronEntry);
  padronStream.setEncoding('latin1');
  const rl = createInterface({ input: padronStream, crlfDelay: Infinity });

  // Clave: CODELEC -> cantidad. A lo sumo ~2200 entradas sin importar
  // cuántos millones de líneas se procesen — la identidad de cada elector
  // (cédula, nombre, apellidos) nunca se guarda en ninguna variable más
  // allá de esta línea de lectura.
  const countsByCodelec = new Map<string, number>();
  let lineNumber = 0;
  let unknownCodelecCount = 0;

  for await (const line of rl) {
    lineNumber += 1;
    if (line.trim().length === 0) continue;

    const codelec = extractCodelecFromPadronLine(line, lineNumber);
    countsByCodelec.set(codelec, (countsByCodelec.get(codelec) ?? 0) + 1);

    if (lineNumber % 500_000 === 0) {
      console.log(`[TSE]   ${lineNumber.toLocaleString('es-CR')} líneas procesadas...`);
    }
  }

  zipfile.close();
  console.log(`[TSE] ${lineNumber.toLocaleString('es-CR')} electores procesados. Agregando por distrito...`);

  const aggregated = new Map<string, { provincia: string; canton: string; distrito: string; cantidad: number }>();
  for (const [codelec, cantidad] of countsByCodelec) {
    const distrito = distelecMap.get(codelec);
    if (!distrito) {
      unknownCodelecCount += 1;
    }
    const { provincia, canton, distrito: nombreDistrito } = distrito ?? {
      provincia: PROVINCIA_DESCONOCIDA,
      canton: CANTON_DESCONOCIDO,
      distrito: `${DISTRITO_DESCONOCIDO} (${codelec})`,
    };
    const key = `${provincia}|${canton}|${nombreDistrito}`;
    const existing = aggregated.get(key);
    aggregated.set(key, {
      provincia,
      canton,
      distrito: nombreDistrito,
      cantidad: (existing?.cantidad ?? 0) + cantidad,
    });
  }

  if (unknownCodelecCount > 0) {
    console.warn(
      `[TSE] ADVERTENCIA — ${unknownCodelecCount} código(s) electoral(es) sin distrito conocido en DISTELEC.txt.`,
    );
  }

  const rowsToInsert = [...aggregated.values()].map((row) => ({
    fechaSnapshot,
    provincia: row.provincia,
    canton: row.canton,
    distrito: row.distrito,
    cantidadElectores: row.cantidad,
  }));

  await prisma.$transaction(
    async (tx) => {
      await tx.tsePadronSnapshot.deleteMany({ where: { fechaSnapshot } });
      await tx.tsePadronSnapshot.createMany({ data: rowsToInsert });
    },
    { timeout: 120_000 },
  );

  await prisma.dataSourceStatus.upsert({
    where: { sourceKey: TSE_SOURCE_KEY },
    update: {
      institution: TSE_INSTITUTION,
      officialUrl: TSE_OFFICIAL_URL,
      resourceUrl: TSE_PADRON_ZIP_URL,
      resourceFormat: 'ZIP',
      sourceUpdatedAt: fechaSnapshot,
      retrievedAt: new Date(),
      status: 'AVAILABLE',
      errorMessage: null,
      checksum,
    },
    create: {
      sourceKey: TSE_SOURCE_KEY,
      institution: TSE_INSTITUTION,
      officialUrl: TSE_OFFICIAL_URL,
      resourceUrl: TSE_PADRON_ZIP_URL,
      resourceFormat: 'ZIP',
      sourceUpdatedAt: fechaSnapshot,
      retrievedAt: new Date(),
      status: 'AVAILABLE',
      checksum,
    },
  });

  console.log(
    `[TSE] Listo: ${aggregated.size} distritos con agregados, ${lineNumber.toLocaleString('es-CR')} electores totales.`,
  );
  await prisma.$disconnect();
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[TSE] FALLÓ —', message);
  await prisma.dataSourceStatus.upsert({
    where: { sourceKey: TSE_SOURCE_KEY },
    update: { status: 'ERROR', errorMessage: message, retrievedAt: new Date() },
    create: {
      sourceKey: TSE_SOURCE_KEY,
      institution: TSE_INSTITUTION,
      officialUrl: TSE_OFFICIAL_URL,
      status: 'ERROR',
      errorMessage: message,
      retrievedAt: new Date(),
    },
  });
  await prisma.$disconnect();
  process.exit(1);
});
