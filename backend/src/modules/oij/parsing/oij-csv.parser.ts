import { Readable } from 'node:stream';
import { parse } from 'csv-parse';
import { mapOijCsvRecord, OijCsvRow } from './oij-csv-row.mapper.js';

export interface ParseOijCsvResult {
  rows: OijCsvRow[];
  rowCount: number;
  /** Filas donde la columna vacía conocida (ver oij.constants.ts) trajo datos */
  unexpectedSpacerCount: number;
  /** Filas donde se reconstruyó Nacionalidad por una coma sin escapar en la fuente */
  repairedEmbeddedCommaCount: number;
}

/**
 * El CSV del OIJ llega codificado en ISO-8859-1 (Latin-1), no UTF-8 —
 * verificado contra el recurso real. `buffer.toString('latin1')` decodifica
 * correctamente byte a byte sin depender de una librería adicional.
 *
 * `relax_column_count_more` está activo porque la fuente no escapa comas
 * dentro de Nacionalidad (ver oij-csv-row.mapper.ts); sin esta opción
 * csv-parse aborta todo el archivo en la primera fila con una nacionalidad
 * como "CONGO, REPUBLICA DEMOCRATICA DEL". Una fila con MENOS columnas de
 * las esperadas sigue siendo un error fatal (relax_column_count_less queda
 * en false), porque ahí sí faltaría información real.
 */
export async function parseOijCsvBuffer(buffer: Buffer): Promise<ParseOijCsvResult> {
  const text = buffer.toString('latin1');

  const parser = Readable.from(text).pipe(
    parse({
      columns: false,
      skip_empty_lines: true,
      relax_column_count_more: true,
      trim: false,
    }),
  );

  const rows: OijCsvRow[] = [];
  let unexpectedSpacerCount = 0;
  let repairedEmbeddedCommaCount = 0;
  let lineNumber = 0;

  for await (const record of parser as AsyncIterable<string[]>) {
    lineNumber += 1;
    const { row, unexpectedSpacerValue, repairedEmbeddedComma } = mapOijCsvRecord(record, lineNumber);
    rows.push(row);
    if (unexpectedSpacerValue) {
      unexpectedSpacerCount += 1;
    }
    if (repairedEmbeddedComma) {
      repairedEmbeddedCommaCount += 1;
    }
  }

  return { rows, rowCount: rows.length, unexpectedSpacerCount, repairedEmbeddedCommaCount };
}
