import { Readable } from 'node:stream';
import { parse } from 'csv-parse';
import { PROVEEDORES_ENTRY, PROVEEDORES_HEADER } from '../sicop.constants.js';
import { parseSicopIsoDateTimeOptional } from './sicop-datetime.util.js';
import { verifySicopHeader } from './sicop-schema.validator.js';

export interface SicopProveedorRow {
  cedula: string;
  nombre: string;
  tipoProveedor: string | null;
  tamanoProveedor: string | null;
  zonaGeografica: string | null;
  fechaRegistro: Date | null;
  fechaModificacion: Date | null;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Parsea Proveedores.csv (tabla de dimensión, 1 fila por proveedor). No se
 * importan FECHA_CONSTITUCION/FECHA_EXPIRACION — ver sicop.constants.ts.
 * Nótese que las últimas 3 columnas del header real vienen en minúscula
 * (`zona_geo_prov`, `fecha_registro`, `fecha_mod`), a diferencia del resto
 * del archivo — verificado, no es un error de este proyecto.
 */
export async function parseProveedoresCsv(text: string): Promise<SicopProveedorRow[]> {
  const firstLineEnd = text.indexOf('\n');
  const headerLine = text.slice(0, firstLineEnd === -1 ? undefined : firstLineEnd).replace(/\r$/, '');
  verifySicopHeader(headerLine.split(';'), PROVEEDORES_HEADER, PROVEEDORES_ENTRY);

  const parser = Readable.from(text).pipe(
    parse({ columns: true, delimiter: ';', bom: true, skip_empty_lines: true, trim: false }),
  );

  const rows: SicopProveedorRow[] = [];
  for await (const record of parser as AsyncIterable<Record<string, string>>) {
    rows.push({
      cedula: record.CEDULA_PROVEEDOR.trim(),
      nombre: record.NOMBRE_PROVEEDOR.trim(),
      tipoProveedor: emptyToNull(record.TIPO_PROVEEDOR),
      tamanoProveedor: emptyToNull(record['TAMAÑO_PROVEEDOR']),
      zonaGeografica: emptyToNull(record.zona_geo_prov),
      fechaRegistro: parseSicopIsoDateTimeOptional(record.fecha_registro, 'fecha_registro'),
      fechaModificacion: parseSicopIsoDateTimeOptional(record.fecha_mod, 'fecha_mod'),
    });
  }
  return rows;
}
