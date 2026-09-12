import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { PADRON_CODELEC_FIELD_INDEX, PADRON_FIELD_COUNT } from '../tse.constants.js';

/**
 * Extrae SOLO el código electoral (CODELEC) de una línea del padrón.
 * Deliberadamente no existe una función que devuelva cédula, nombre ni
 * apellidos: esos campos nunca deben viajar más allá de esta línea de
 * código (verificado: CEDULA, CODELEC, RELLENO, FECHACADUC, JUNTA, NOMBRE,
 * 1.APELLIDO, 2.APELLIDO, en ese orden, separados por comas).
 */
export function extractCodelecFromPadronLine(line: string, lineNumber: number): string {
  const fields = line.split(',');
  if (fields.length !== PADRON_FIELD_COUNT) {
    throw new SchemaMismatchError(
      `PADRON_COMPLETO.txt línea ${lineNumber}: se esperaban ${PADRON_FIELD_COUNT} columnas, se encontraron ${fields.length}.`,
    );
  }

  const codelec = fields[PADRON_CODELEC_FIELD_INDEX]!.trim();
  if (!/^\d{6}$/.test(codelec)) {
    throw new SchemaMismatchError(`PADRON_COMPLETO.txt línea ${lineNumber}: CODELEC inválido "${codelec}".`);
  }

  return codelec;
}
