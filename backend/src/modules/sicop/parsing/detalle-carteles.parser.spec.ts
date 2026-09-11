import { describe, expect, it } from 'vitest';
import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { parseDetalleCartelesCsv } from './detalle-carteles.parser.js';

// Fixture: 2 filas reales de DetalleCarteles.csv (ZIP de agosto 2026,
// observatoriocomprapublica.go.cr), sin modificar salvo recorte del resto
// del archivo.
const REAL_FIXTURE = [
  'NRO_SICOP;CEDULA_INSTITUCION;FECHA_PUBLICACION;NRO_PROCEDIMIENTO;TIPO_PROCEDIMIENTO;MODALIDAD_PROCEDIMIENTO;CARTEL_STAT;CARTEL_NM;FECHAH_APERTURA;CODIGO_BPIP;CLAS_OBJ;COD_EXCEPCION;DES_EXCEPCION;MONTO_EST;FECHA_MOD',
  '"20260500693";"4000042138";2026-08-05 11:51:08.0000000;"2026LY-000012-0021400001";"LICITACIÓN MAYOR";"Según demanda";"En recepción de ofertas";"Compra productos cementicios y agregados asfálticos a nivel nacional.";2026-09-18 07:05:00.0000000;;"BIENES";;;395025793.370000;',
  '"20260800363";"3101007749";2026-08-05 08:13:25.0000000;"2026PX-000088-0016700101";"PROCEDIMIENTO POR EXCEPCIÓN";"Servicios";"Contrato";"CAP0145-2026 TÉCNICO EN SEGUROS";2026-08-07 08:01:00.0000000;;"SERVICIOS";"C0000111";"Capacitación abierta (Inciso e del artículo 3 LGCP 9986)";512000.000000;',
].join('\n');

describe('parseDetalleCartelesCsv', () => {
  it('parsea las columnas reales verificadas', async () => {
    const rows = await parseDetalleCartelesCsv(REAL_FIXTURE);
    expect(rows).toHaveLength(2);

    expect(rows[0]).toMatchObject({
      nroSicop: '20260500693',
      cedulaInstitucion: '4000042138',
      numeroProcedimiento: '2026LY-000012-0021400001',
      tipoProcedimiento: 'LICITACIÓN MAYOR',
      modalidadProcedimiento: 'Según demanda',
      estado: 'En recepción de ofertas',
      clasificacionObjeto: 'BIENES',
      codigoExcepcion: null,
      descripcionExcepcion: null,
      fechaModificacion: null,
    });
    expect(rows[0].fechaPublicacion.toISOString()).toBe('2026-08-05T11:51:08.000Z');
    expect(rows[0].fechaApertura?.toISOString()).toBe('2026-09-18T07:05:00.000Z');
    expect(rows[0].montoEstimado).toBeCloseTo(395025793.37, 2);
  });

  it('conserva el código y descripción de excepción cuando vienen presentes', async () => {
    const rows = await parseDetalleCartelesCsv(REAL_FIXTURE);
    expect(rows[1].codigoExcepcion).toBe('C0000111');
    expect(rows[1].descripcionExcepcion).toBe('Capacitación abierta (Inciso e del artículo 3 LGCP 9986)');
    expect(rows[1].estado).toBe('Contrato');
  });

  it('lanza SchemaMismatchError si falta una columna esperada', async () => {
    const brokenHeader = REAL_FIXTURE.replace('CARTEL_STAT;', '');
    await expect(parseDetalleCartelesCsv(brokenHeader)).rejects.toThrow(SchemaMismatchError);
  });
});
