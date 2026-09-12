import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { PRONAE_TOTAL_ROW_LABEL } from '../portal-datos.constants.js';

export interface PronaeRow {
  modalidad: string;
  anio: number;
  cantidad: number;
}

export interface TotalMismatch {
  anio: number;
  declarado: number;
  calculado: number;
}

export interface ParsePronaeResult {
  rows: PronaeRow[];
  /** Discrepancias entre la fila "Total" de la fuente y la suma real por modalidad. */
  totalMismatches: TotalMismatch[];
}

/**
 * Solo acepta "-" (cero, convención verificada de la fuente) o dígitos con
 * espacios como separador de miles. `Number('')` es `0` en JS, así que un
 * simple `Number(...)` tras limpiar caracteres dejaría pasar basura como
 * "n/d" silenciosamente — por eso se valida el formato explícitamente antes.
 */
function parseCantidad(raw: string, modalidad: string, anio: number): number {
  const trimmed = raw.trim();
  if (trimmed === '-') return 0;

  if (!/^[\d\s]+$/.test(trimmed)) {
    throw new SchemaMismatchError(`Valor inválido para "${modalidad}" en ${anio}: "${raw}"`);
  }
  return Number(trimmed.replace(/\s/g, ''));
}

/**
 * Parsea la hoja "C 1.4" del XLSX real del PRONAE: primera columna
 * "Modalidad", una columna por año. Los valores llegan como texto con
 * espacios como separador de miles (" 25 952") y "-" para cero — verificado
 * contra el recurso real del Portal Nacional. La fila "Total" se usa solo
 * para una verificación cruzada, no se incluye en el resultado.
 */
export function parsePronaeSheet(rows: string[][]): ParsePronaeResult {
  if (rows.length === 0) {
    throw new SchemaMismatchError('La hoja del PRONAE está vacía.');
  }

  const [header, ...dataRows] = rows;
  const firstColumn = (header[0] ?? '').trim().toLowerCase();
  if (firstColumn !== 'modalidad') {
    throw new SchemaMismatchError(
      `Encabezado inesperado: se esperaba "Modalidad" en la primera columna, se encontró "${header[0]}".`,
    );
  }

  const anios = header.slice(1).map((h) => {
    const anio = Number(h.trim());
    if (!Number.isInteger(anio)) {
      throw new SchemaMismatchError(`Encabezado de año inválido: "${h}".`);
    }
    return anio;
  });

  if (anios.length === 0) {
    throw new SchemaMismatchError('No se encontraron columnas de año en el encabezado.');
  }

  const parsedRows: PronaeRow[] = [];
  let totalRowValues: number[] | null = null;

  for (const row of dataRows) {
    const modalidad = (row[0] ?? '').trim();
    if (!modalidad) continue;

    const valores = anios.map((anio, idx) => parseCantidad(row[idx + 1] ?? '', modalidad, anio));

    if (modalidad.toUpperCase() === PRONAE_TOTAL_ROW_LABEL) {
      totalRowValues = valores;
      continue;
    }

    anios.forEach((anio, idx) => {
      parsedRows.push({ modalidad, anio, cantidad: valores[idx]! });
    });
  }

  if (parsedRows.length === 0) {
    throw new SchemaMismatchError('No se encontraron filas de modalidad con datos.');
  }

  const totalMismatches: TotalMismatch[] = [];
  if (totalRowValues) {
    anios.forEach((anio, idx) => {
      const calculado = parsedRows.filter((r) => r.anio === anio).reduce((sum, r) => sum + r.cantidad, 0);
      const declarado = totalRowValues![idx]!;
      if (calculado !== declarado) {
        totalMismatches.push({ anio, declarado, calculado });
      }
    });
  }

  return { rows: parsedRows, totalMismatches };
}
