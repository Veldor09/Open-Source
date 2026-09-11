import { Readable } from 'node:stream';
import { parse } from 'csv-parse';
import { OFERTAS_ENTRY, OFERTAS_HEADER } from '../sicop.constants.js';
import { parseSicopIsoDateTime } from './sicop-datetime.util.js';
import { verifySicopHeader } from './sicop-schema.validator.js';

export interface SicopOfertaRow {
  nroOferta: string;
  nroSicop: string;
  cedulaProveedor: string;
  fechaPresentacion: Date;
  tipoOferta: string;
  idConsorcio: string | null;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Parsea Ofertas.csv (1 fila por oferta presentada). `TIPO_OFERTA` tiene 3
 * valores reales verificados: "Individual", "Conjunta" y "Acuerdo
 * Consorcial" (no solo "Individual", que era lo único visible en una
 * muestra pequeña) — `ID_CONSORCIO` viene poblado en las dos últimas.
 *
 * NO usar el conteo de filas de esta tabla como "número de competidores":
 * un mismo proveedor puede tener muchas filas para el mismo NRO_SICOP (caso
 * real verificado: 1525 filas, 21 proveedores distintos). Ver
 * sicop.service.ts#getCompetition.
 */
export async function parseOfertasCsv(text: string): Promise<SicopOfertaRow[]> {
  const firstLineEnd = text.indexOf('\n');
  const headerLine = text.slice(0, firstLineEnd === -1 ? undefined : firstLineEnd).replace(/\r$/, '');
  verifySicopHeader(headerLine.split(';'), OFERTAS_HEADER, OFERTAS_ENTRY);

  const parser = Readable.from(text).pipe(
    parse({ columns: true, delimiter: ';', bom: true, skip_empty_lines: true, trim: false }),
  );

  const rows: SicopOfertaRow[] = [];
  for await (const record of parser as AsyncIterable<Record<string, string>>) {
    rows.push({
      nroOferta: record.NRO_OFERTA.trim(),
      nroSicop: record.NRO_SICOP.trim(),
      cedulaProveedor: record.CEDULA_PROVEEDOR.trim(),
      fechaPresentacion: parseSicopIsoDateTime(record.FECHA_PRESENTA_OFERTA, 'FECHA_PRESENTA_OFERTA'),
      tipoOferta: record.TIPO_OFERTA.trim(),
      idConsorcio: emptyToNull(record.ID_CONSORCIO),
    });
  }
  return rows;
}
