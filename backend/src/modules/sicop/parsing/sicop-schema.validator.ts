import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';

/**
 * Compara el header real (primera línea) de un CSV de SICOP contra el
 * esperado, columna por columna. A diferencia de OIJ (sin header) o TSE
 * (ancho fijo), los 4 reportes de SICOP sí traen encabezado, así que se
 * puede validar exactamente antes de parsear una sola fila — si difiere,
 * se detiene la importación completa de ese período (nunca se importa con
 * un esquema distinto al verificado).
 */
export function verifySicopHeader(actualHeader: string[], expectedHeader: string[], fileName: string): void {
  const actualSet = new Set(actualHeader);
  const expectedSet = new Set(expectedHeader);

  const faltantes = expectedHeader.filter((c) => !actualSet.has(c));
  const sobrantes = actualHeader.filter((c) => !expectedSet.has(c));
  const mismoConjuntoOrdenDistinto =
    faltantes.length === 0 && sobrantes.length === 0 && actualHeader.join(';') !== expectedHeader.join(';');

  if (faltantes.length === 0 && sobrantes.length === 0 && !mismoConjuntoOrdenDistinto) {
    return;
  }

  const partes = [
    `El header real de ${fileName} no coincide con el esperado.`,
    `Faltan: ${faltantes.length ? faltantes.join(', ') : 'ninguna'}.`,
    `Sobran: ${sobrantes.length ? sobrantes.join(', ') : 'ninguna'}.`,
  ];
  if (mismoConjuntoOrdenDistinto) {
    partes.push('Mismas columnas pero en distinto orden — revisar mapeo posicional antes de continuar.');
  }

  throw new SchemaMismatchError(partes.join(' '));
}
