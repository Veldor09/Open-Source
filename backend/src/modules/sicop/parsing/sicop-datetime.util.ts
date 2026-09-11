import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';

const ISO_DATETIME_PATTERN = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/;
const ISO_DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLASH_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/**
 * Fechas tipo `2026-08-05 11:51:08.0000000` (export datetime2 de SQL
 * Server, verificado en DetalleCarteles/InstitucionesRegistradas/
 * Proveedores). Se trunca a segundos; los 7 dígitos fraccionarios vistos en
 * la muestra real siempre fueron ".0000000", pero no se asume que siempre
 * lo sean — simplemente se descartan.
 */
export function parseSicopIsoDateTime(raw: string, campo: string): Date {
  const match = ISO_DATETIME_PATTERN.exec(raw.trim());
  if (!match) {
    throw new SchemaMismatchError(`Campo "${campo}": fecha inválida "${raw}" (se esperaba YYYY-MM-DD HH:mm:ss...).`);
  }
  const fecha = new Date(`${match[1]}T${match[2]}Z`);
  if (Number.isNaN(fecha.getTime())) {
    throw new SchemaMismatchError(`Campo "${campo}": fecha inválida "${raw}".`);
  }
  return fecha;
}

export function parseSicopIsoDateTimeOptional(raw: string, campo: string): Date | null {
  if (raw.trim().length === 0) return null;
  return parseSicopIsoDateTime(raw, campo);
}

/**
 * Fechas sin hora tipo `2025-11-25` — usado para FECHA_SOL_CONTRA_CL, la
 * versión ya normalizada por la propia SICOP de FECHA_SOL_CONTRA (que en
 * crudo viene DD/MM/YYYY). Se prefiere la columna _CL para no reimplementar
 * la normalización que SICOP ya hace.
 */
export function parseSicopIsoDateOnlyOptional(raw: string, campo: string): Date | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (!ISO_DATE_ONLY_PATTERN.test(trimmed)) {
    throw new SchemaMismatchError(`Campo "${campo}": fecha inválida "${raw}" (se esperaba YYYY-MM-DD).`);
  }
  const fecha = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime())) {
    throw new SchemaMismatchError(`Campo "${campo}": fecha inválida "${raw}".`);
  }
  return fecha;
}

/**
 * Fechas tipo `25/11/2025` (DD/MM/YYYY) — formato usado únicamente por
 * FECHA_ADJUD_FIRME en ProcedimientoAdjudicacion.csv (verificado: el día 25
 * en "25/11/2025" descarta que sea MM/DD). FECHA_SOL_CONTRA usa el mismo
 * formato, pero SICOP publica una columna paralela ya normalizada
 * (FECHA_SOL_CONTRA_CL, en YYYY-MM-DD) que se prefiere en su lugar —
 * ver procedimiento-adjudicacion.parser.ts.
 */
export function parseSicopSlashDateOptional(raw: string, campo: string): Date | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  const match = SLASH_DATE_PATTERN.exec(trimmed);
  if (!match) {
    throw new SchemaMismatchError(`Campo "${campo}": fecha inválida "${raw}" (se esperaba DD/MM/YYYY).`);
  }
  const [, dd, mm, yyyy] = match;
  const fecha = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime())) {
    throw new SchemaMismatchError(`Campo "${campo}": fecha inválida "${raw}".`);
  }
  return fecha;
}
