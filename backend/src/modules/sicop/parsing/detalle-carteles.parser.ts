import { Readable } from 'node:stream';
import { parse } from 'csv-parse';
import { DETALLE_CARTELES_ENTRY, DETALLE_CARTELES_HEADER } from '../sicop.constants.js';
import { parseSicopIsoDateTime, parseSicopIsoDateTimeOptional } from './sicop-datetime.util.js';
import { parseSicopDecimalOptional } from './sicop-numeric.util.js';
import { verifySicopHeader } from './sicop-schema.validator.js';

export interface SicopProcedimientoRow {
  nroSicop: string;
  cedulaInstitucion: string;
  numeroProcedimiento: string;
  tipoProcedimiento: string;
  modalidadProcedimiento: string;
  descripcion: string;
  estado: string;
  clasificacionObjeto: string | null;
  montoEstimado: number | null;
  fechaPublicacion: Date;
  fechaApertura: Date | null;
  fechaModificacion: Date | null;
  codigoExcepcion: string | null;
  descripcionExcepcion: string | null;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Parsea DetalleCarteles.csv (cabecera de procedimiento — 1 fila por
 * NRO_SICOP). Estructura verificada contra una muestra real de agosto 2026;
 * ver sicop.constants.ts para el header esperado exacto.
 */
export async function parseDetalleCartelesCsv(text: string): Promise<SicopProcedimientoRow[]> {
  const firstLineEnd = text.indexOf('\n');
  const headerLine = text.slice(0, firstLineEnd === -1 ? undefined : firstLineEnd).replace(/\r$/, '');
  verifySicopHeader(headerLine.split(';'), DETALLE_CARTELES_HEADER, DETALLE_CARTELES_ENTRY);

  const parser = Readable.from(text).pipe(
    parse({ columns: true, delimiter: ';', bom: true, skip_empty_lines: true, trim: false }),
  );

  const rows: SicopProcedimientoRow[] = [];
  for await (const record of parser as AsyncIterable<Record<string, string>>) {
    rows.push({
      nroSicop: record.NRO_SICOP.trim(),
      cedulaInstitucion: record.CEDULA_INSTITUCION.trim(),
      numeroProcedimiento: record.NRO_PROCEDIMIENTO.trim(),
      tipoProcedimiento: record.TIPO_PROCEDIMIENTO.trim(),
      modalidadProcedimiento: record.MODALIDAD_PROCEDIMIENTO.trim(),
      descripcion: record.CARTEL_NM.trim(),
      estado: record.CARTEL_STAT.trim(),
      clasificacionObjeto: emptyToNull(record.CLAS_OBJ),
      montoEstimado: parseSicopDecimalOptional(record.MONTO_EST, 'MONTO_EST'),
      fechaPublicacion: parseSicopIsoDateTime(record.FECHA_PUBLICACION, 'FECHA_PUBLICACION'),
      fechaApertura: parseSicopIsoDateTimeOptional(record.FECHAH_APERTURA, 'FECHAH_APERTURA'),
      fechaModificacion: parseSicopIsoDateTimeOptional(record.FECHA_MOD, 'FECHA_MOD'),
      codigoExcepcion: emptyToNull(record.COD_EXCEPCION),
      descripcionExcepcion: emptyToNull(record.DES_EXCEPCION),
    });
  }
  return rows;
}
