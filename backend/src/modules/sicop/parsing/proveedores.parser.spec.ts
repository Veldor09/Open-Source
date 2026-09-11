import { describe, expect, it } from 'vitest';
import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { parseProveedoresCsv } from './proveedores.parser.js';

// Fixture: filas reales de Proveedores.csv (ZIP de agosto 2026). Nótese el
// header real con las últimas 3 columnas en minúscula.
const REAL_FIXTURE = [
  'CEDULA_PROVEEDOR;NOMBRE_PROVEEDOR;TIPO_PROVEEDOR;TAMAÑO_PROVEEDOR;FECHA_CONSTITUCION;FECHA_EXPIRACION;zona_geo_prov;fecha_registro;fecha_mod',
  '"3101297906";"ARCO IMPRESOS LITOGRAFIA E IMPRENTA SOCIEDAD ANONIMA";"Nacional Jurídico";"Grande";"11072001";"11072100";"San Juan, Tibás, San José";2014-09-10 00:00:00.0000000;2018-04-23 00:00:00.0000000',
  '"0303900928";"DANIEL ALBERTO SANCHEZ MADRIGAL";"Nacional Físico";"Microemprendedor";"No aplica";"No aplica";"Tucurrique, Jiménez, Cartago";2011-08-12 00:00:00.0000000;2015-01-22 00:00:00.0000000',
].join('\n');

describe('parseProveedoresCsv', () => {
  it('parsea un proveedor jurídico (empresa) con sus columnas reales', async () => {
    const rows = await parseProveedoresCsv(REAL_FIXTURE);
    expect(rows[0]).toMatchObject({
      cedula: '3101297906',
      nombre: 'ARCO IMPRESOS LITOGRAFIA E IMPRENTA SOCIEDAD ANONIMA',
      tipoProveedor: 'Nacional Jurídico',
      tamanoProveedor: 'Grande',
      zonaGeografica: 'San Juan, Tibás, San José',
    });
    expect(rows[0].fechaRegistro?.toISOString()).toBe('2014-09-10T00:00:00.000Z');
  });

  it('parsea un proveedor físico (persona individual) sin fallar', async () => {
    const rows = await parseProveedoresCsv(REAL_FIXTURE);
    expect(rows[1].tipoProveedor).toBe('Nacional Físico');
    expect(rows[1].tamanoProveedor).toBe('Microemprendedor');
  });

  it('lanza SchemaMismatchError si falta una columna', async () => {
    const broken = REAL_FIXTURE.replace('TAMAÑO_PROVEEDOR;', '');
    await expect(parseProveedoresCsv(broken)).rejects.toThrow(SchemaMismatchError);
  });
});
