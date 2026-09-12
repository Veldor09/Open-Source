import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { OIJ_CSV_COLUMN_COUNT } from '../oij.constants.js';

export interface OijCsvRow {
  delito: string;
  subDelito: string;
  fecha: Date;
  anio: number;
  victima: string;
  subVictima: string;
  edad: string;
  nacionalidad: string;
  provincia: string;
  canton: string;
  distrito: string;
}

export interface MapCsvRecordResult {
  row: OijCsvRow;
  /** true si la columna 7 (siempre vacía en la muestra verificada) trae datos */
  unexpectedSpacerValue: boolean;
  /** true si hubo que reconstruir Nacionalidad por una coma sin escapar en la fuente */
  repairedEmbeddedComma: boolean;
}

// Delito, SubDelito, Fecha, Victima, SubVictima, Edad (+ la columna vacía = 7)
const FIXED_PREFIX_LENGTH = 7;
// Provincia, Canton, Distrito
const FIXED_SUFFIX_LENGTH = 3;

/**
 * Convierte una fila cruda del CSV del OIJ (sin encabezado) a un objeto
 * tipado. El orden de columnas fue verificado contra el XSD del recurso XML
 * del mismo dataset — ver oij.constants.ts.
 *
 * La fuente no escapa comas dentro de Nacionalidad (nombres de país como
 * "CONGO, REPUBLICA DEMOCRATICA DEL" o "COREA, REPUBLICA DE" vienen tal
 * cual, sin comillas), lo que produce filas con más de 11 columnas.
 * Verificado con datos reales de 2015 y confirmado en 2016/2017/2021-2025.
 * Reconstruimos Nacionalidad uniendo todo lo que quede entre la columna
 * vacía y los 3 campos geográficos finales (que nunca traen comas).
 */
export function mapOijCsvRecord(fields: string[], lineNumber: number): MapCsvRecordResult {
  let workingFields = fields;
  let repairedEmbeddedComma = false;

  if (fields.length > OIJ_CSV_COLUMN_COUNT) {
    const prefix = fields.slice(0, FIXED_PREFIX_LENGTH);
    const suffix = fields.slice(fields.length - FIXED_SUFFIX_LENGTH);
    const nacionalidadParts = fields.slice(FIXED_PREFIX_LENGTH, fields.length - FIXED_SUFFIX_LENGTH);

    workingFields = [...prefix, nacionalidadParts.join(','), ...suffix];
    repairedEmbeddedComma = true;
  }

  if (workingFields.length !== OIJ_CSV_COLUMN_COUNT) {
    throw new SchemaMismatchError(
      `Fila ${lineNumber}: se esperaban ${OIJ_CSV_COLUMN_COUNT} columnas, se encontraron ${fields.length}. ` +
        'El formato del CSV del OIJ pudo haber cambiado; revisar antes de continuar la importación.',
    );
  }

  const [delito, subDelito, fechaRaw, victima, subVictima, edadRaw, spacer, nacionalidad, provincia, canton, distrito] =
    workingFields;

  const fechaTrimmed = fechaRaw.trim();
  const fecha = new Date(`${fechaTrimmed}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime())) {
    throw new SchemaMismatchError(`Fila ${lineNumber}: fecha inválida "${fechaRaw}".`);
  }

  const row: OijCsvRow = {
    delito: delito.trim(),
    subDelito: subDelito.trim(),
    fecha,
    anio: fecha.getUTCFullYear(),
    victima: victima.trim(),
    subVictima: subVictima.trim(),
    edad: edadRaw.trim(),
    nacionalidad: nacionalidad.trim(),
    provincia: provincia.trim(),
    canton: canton.trim(),
    distrito: distrito.trim(),
  };

  return {
    row,
    unexpectedSpacerValue: spacer.trim().length > 0,
    repairedEmbeddedComma,
  };
}
