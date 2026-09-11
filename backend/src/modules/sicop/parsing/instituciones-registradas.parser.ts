import { Readable } from 'node:stream';
import { parse } from 'csv-parse';
import { INSTITUCIONES_REGISTRADAS_ENTRY, INSTITUCIONES_REGISTRADAS_HEADER } from '../sicop.constants.js';
import { parseSicopIsoDateTimeOptional } from './sicop-datetime.util.js';
import { verifySicopHeader } from './sicop-schema.validator.js';

export interface SicopInstitucionRow {
  cedula: string;
  nombre: string;
  zonaGeografica: string | null;
  fechaIngreso: Date | null;
  fechaModificacion: Date | null;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** Parsea InstitucionesRegistradas.csv (tabla de dimensión, 1 fila por institución). */
export async function parseInstitucionesRegistradasCsv(text: string): Promise<SicopInstitucionRow[]> {
  const firstLineEnd = text.indexOf('\n');
  const headerLine = text.slice(0, firstLineEnd === -1 ? undefined : firstLineEnd).replace(/\r$/, '');
  verifySicopHeader(headerLine.split(';'), INSTITUCIONES_REGISTRADAS_HEADER, INSTITUCIONES_REGISTRADAS_ENTRY);

  const parser = Readable.from(text).pipe(
    parse({ columns: true, delimiter: ';', bom: true, skip_empty_lines: true, trim: false }),
  );

  const rows: SicopInstitucionRow[] = [];
  for await (const record of parser as AsyncIterable<Record<string, string>>) {
    rows.push({
      cedula: record.CEDULA.trim(),
      nombre: record.NOMBRE_INSTITUCION.trim(),
      zonaGeografica: emptyToNull(record.ZONA_GEO_INST),
      fechaIngreso: parseSicopIsoDateTimeOptional(record.FECHA_INGRESO, 'FECHA_INGRESO'),
      fechaModificacion: parseSicopIsoDateTimeOptional(record.FECHA_MOD, 'FECHA_MOD'),
    });
  }
  return rows;
}
