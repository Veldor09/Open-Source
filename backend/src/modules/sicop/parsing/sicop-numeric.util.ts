import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';

/**
 * `Number('')` y `Number('  ')` valen `0` en JS, no `NaN` — el mismo peligro
 * ya encontrado en el parser de PRONAE. Aquí se valida el patrón numérico
 * ANTES de convertir, para no confundir "vacío/corrupto" con "cero real".
 * Algunos montos de la fuente ya traen artefactos de precisión de punto
 * flotante propios de SICOP (ej. "570.82000000000005") — se aceptan tal
 * cual, no se redondean (no es algo que este proyecto esté inventando).
 * Verificado contra datos reales: SICOP también publica montos menores a 1
 * sin el cero inicial (ej. ".085000" en vez de "0.085000") y, para números
 * muy pequeños, en notación científica (ej. "8.9999999999999997E-2" para
 * ~0.09) — probablemente `double.ToString()` de .NET en el origen. El
 * patrón acepta las tres formas; `Number()` ya interpreta notación
 * científica de forma nativa, no se necesita conversión adicional.
 */
const NUMERIC_PATTERN = /^(\d+\.\d+|\.\d+|\d+)([eE][+-]?\d+)?$/;

export function parseSicopDecimal(raw: string, campo: string): number {
  const trimmed = raw.trim();
  if (!NUMERIC_PATTERN.test(trimmed)) {
    throw new SchemaMismatchError(`Campo "${campo}": valor numérico inválido "${raw}".`);
  }
  return Number(trimmed);
}

export function parseSicopDecimalOptional(raw: string, campo: string): number | null {
  if (raw.trim().length === 0) return null;
  return parseSicopDecimal(raw, campo);
}

export function parseSicopInt(raw: string, campo: string): number {
  return Math.trunc(parseSicopDecimal(raw, campo));
}

export function parseSicopIntOptional(raw: string, campo: string): number | null {
  const value = parseSicopDecimalOptional(raw, campo);
  return value === null ? null : Math.trunc(value);
}
