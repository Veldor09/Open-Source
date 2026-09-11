import { describe, expect, it } from 'vitest';
import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { parseOfertasCsv } from './ofertas.parser.js';

// Fixture: filas reales de Ofertas.csv (ZIP de agosto 2026). Incluye los 3
// valores reales de TIPO_OFERTA (no solo "Individual") y un caso real donde
// el mismo proveedor (3101135316) aparece 2 veces para el mismo NRO_SICOP
// con distinto NRO_OFERTA — la razón por la que el indicador de competencia
// nunca debe contar filas ni NRO_OFERTA distintos, solo proveedores distintos.
const REAL_FIXTURE = [
  'NRO_SICOP;NRO_OFERTA;CEDULA_PROVEEDOR;FECHA_PRESENTA_OFERTA;TIPO_OFERTA;ID_CONSORCIO',
  '"20260703326";"D20260804173524142717858865247830";"3101799498";2026-08-04 00:00:00.0000000;"Individual";',
  '"20260402513";"D20260801181333116417856296136640";"3101135316";2026-08-01 00:00:00.0000000;"Individual";',
  '"20260402513";"D20260801181919117017856299595010";"3101135316";2026-08-01 00:00:00.0000000;"Individual";',
  '"20260703127";"D20260804222229112017859037491490";"3101888065";2026-08-04 00:00:00.0000000;"Acuerdo Consorcial";"1202500374"',
  '"20260800996";"D20260814143343107817867396231840";"3101337249";2026-08-14 00:00:00.0000000;"Conjunta";"1202301182"',
].join('\n');

describe('parseOfertasCsv', () => {
  it('parsea una oferta individual sin consorcio', async () => {
    const rows = await parseOfertasCsv(REAL_FIXTURE);
    expect(rows[0]).toMatchObject({
      nroOferta: 'D20260804173524142717858865247830',
      nroSicop: '20260703326',
      cedulaProveedor: '3101799498',
      tipoOferta: 'Individual',
      idConsorcio: null,
    });
    expect(rows[0].fechaPresentacion.toISOString()).toBe('2026-08-04T00:00:00.000Z');
  });

  it('preserva el mismo proveedor apareciendo 2 veces para el mismo procedimiento (no deduplica en el parser)', async () => {
    const rows = await parseOfertasCsv(REAL_FIXTURE);
    const paraEseProcedimiento = rows.filter((r) => r.nroSicop === '20260402513');
    expect(paraEseProcedimiento).toHaveLength(2);
    expect(paraEseProcedimiento[0].cedulaProveedor).toBe('3101135316');
    expect(paraEseProcedimiento[1].cedulaProveedor).toBe('3101135316');
    expect(paraEseProcedimiento[0].nroOferta).not.toBe(paraEseProcedimiento[1].nroOferta);
  });

  it('parsea ofertas en "Acuerdo Consorcial" y "Conjunta" con ID_CONSORCIO poblado', async () => {
    const rows = await parseOfertasCsv(REAL_FIXTURE);
    expect(rows[3]).toMatchObject({ tipoOferta: 'Acuerdo Consorcial', idConsorcio: '1202500374' });
    expect(rows[4]).toMatchObject({ tipoOferta: 'Conjunta', idConsorcio: '1202301182' });
  });

  it('lanza SchemaMismatchError si el header real no coincide', async () => {
    const broken = REAL_FIXTURE.replace('TIPO_OFERTA;', '');
    await expect(parseOfertasCsv(broken)).rejects.toThrow(SchemaMismatchError);
  });
});
