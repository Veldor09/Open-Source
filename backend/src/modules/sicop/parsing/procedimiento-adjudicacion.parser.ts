import { Readable } from 'node:stream';
import { parse } from 'csv-parse';
import { PROCEDIMIENTO_ADJUDICACION_ENTRY, PROCEDIMIENTO_ADJUDICACION_HEADER } from '../sicop.constants.js';
import { parseSicopIsoDateOnlyOptional, parseSicopSlashDateOptional } from './sicop-datetime.util.js';
import { parseSicopDecimal, parseSicopDecimalOptional, parseSicopInt } from './sicop-numeric.util.js';
import { verifySicopHeader } from './sicop-schema.validator.js';

export interface SicopLineaAdjudicadaRow {
  nroSicop: string;
  linea: number;
  anio: number;
  cedulaInstitucion: string;
  institucion: string;
  numeroProcedimiento: string;
  tipoProcedimiento: string;
  modalidadProcedimiento: string;
  descripcionProcedimiento: string;
  descripcionBienServicio: string;
  cantidad: number;
  unidadMedida: string;
  montoUnitario: number;
  monedaPrecioEstimado: string;
  monedaAdjudicada: string;
  montoLineaAdjudicada: number;
  montoLineaAdjudicadaCrc: number | null;
  montoLineaAdjudicadaUsd: number | null;
  fechaAdjudicacionFirme: Date | null;
  fechaSolicitudContrato: Date | null;
  cedulaProveedor: string;
  nombreProveedor: string;
  perfilProveedor: string | null;
  objetoGasto: string | null;
  productoId: string | null;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Parsea ProcedimientoAdjudicacion.csv (1 fila por línea adjudicada).
 *
 * Deliberadamente NO se persisten CEDULA_REPRESENTANTE ni REPRESENTANTE
 * (nombre de una persona física, el representante legal del proveedor):
 * mismo criterio de privacidad ya aplicado a OIJ/TSE en este proyecto — no
 * se guarda identidad de personas cuando no es necesaria para el propósito
 * de transparencia de gasto público del observatorio.
 *
 * Se usan las columnas ya "limpias" que la propia SICOP publica en paralelo
 * (FECHA_SOL_CONTRA_CL en vez de FECHA_SOL_CONTRA, PROD_ID_CL en vez de
 * PROD_ID) para no reimplementar su normalización ni arrastrar el espacio
 * inicial verificado en PROD_ID.
 */
export async function parseProcedimientoAdjudicacionCsv(text: string): Promise<SicopLineaAdjudicadaRow[]> {
  const firstLineEnd = text.indexOf('\n');
  const headerLine = text.slice(0, firstLineEnd === -1 ? undefined : firstLineEnd).replace(/\r$/, '');
  verifySicopHeader(headerLine.split(';'), PROCEDIMIENTO_ADJUDICACION_HEADER, PROCEDIMIENTO_ADJUDICACION_ENTRY);

  const parser = Readable.from(text).pipe(
    parse({ columns: true, delimiter: ';', bom: true, skip_empty_lines: true, trim: false }),
  );

  const rows: SicopLineaAdjudicadaRow[] = [];
  for await (const record of parser as AsyncIterable<Record<string, string>>) {
    rows.push({
      nroSicop: record.NRO_SICOP.trim(),
      linea: parseSicopInt(record.LINEA, 'LINEA'),
      anio: parseSicopInt(record.ANO, 'ANO'),
      cedulaInstitucion: record.CEDULA.trim(),
      institucion: record.INSTITUCION.trim(),
      numeroProcedimiento: record.NUMERO_PROCEDIMIENTO.trim(),
      tipoProcedimiento: record.TIPO_PROCEDIMIENTO.trim(),
      modalidadProcedimiento: record.MODALIDAD_PROCEDIMIENTO.trim(),
      descripcionProcedimiento: record.DESCR_PROCEDIMIENTO.trim(),
      descripcionBienServicio: record.DESCR_BIEN_SERVICIO.trim(),
      cantidad: parseSicopDecimal(record.CANTIDAD, 'CANTIDAD'),
      unidadMedida: record.UNIDAD_MEDIDA.trim(),
      montoUnitario: parseSicopDecimal(record.MONTO_UNITARIO, 'MONTO_UNITARIO'),
      monedaPrecioEstimado: record.MONEDA_PRECIO_EST.trim(),
      monedaAdjudicada: record.MONEDA_ADJUDICADA.trim(),
      montoLineaAdjudicada: parseSicopDecimal(record.MONTO_ADJU_LINEA, 'MONTO_ADJU_LINEA'),
      montoLineaAdjudicadaCrc: parseSicopDecimalOptional(record.MONTO_ADJU_LINEA_CRC, 'MONTO_ADJU_LINEA_CRC'),
      montoLineaAdjudicadaUsd: parseSicopDecimalOptional(record.MONTO_ADJU_LINEA_USD, 'MONTO_ADJU_LINEA_USD'),
      fechaAdjudicacionFirme: parseSicopSlashDateOptional(record.FECHA_ADJUD_FIRME, 'FECHA_ADJUD_FIRME'),
      fechaSolicitudContrato: parseSicopIsoDateOnlyOptional(record.FECHA_SOL_CONTRA_CL, 'FECHA_SOL_CONTRA_CL'),
      cedulaProveedor: record.CEDULA_PROVEEDOR.trim(),
      nombreProveedor: record.NOMBRE_PROVEEDOR.trim(),
      perfilProveedor: emptyToNull(record.PERFIL_PROV),
      objetoGasto: emptyToNull(record.OBJETO_GASTO),
      productoId: emptyToNull(record.PROD_ID_CL),
    });
  }
  return rows;
}
