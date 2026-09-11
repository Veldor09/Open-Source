import { describe, expect, it } from 'vitest';
import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { parseProcedimientoAdjudicacionCsv } from './procedimiento-adjudicacion.parser.js';

// Fixture: 2 filas reales de ProcedimientoAdjudicacion.csv (ZIP de agosto
// 2026, observatoriocomprapublica.go.cr). La primera fila es exactamente el
// caso de advertencia del proyecto: precio estimado en CRC, adjudicado en
// USD, con ambos montos ya convertidos publicados por la propia SICOP.
const REAL_FIXTURE = [
  'CEDULA;INSTITUCION;ANO;NUMERO_PROCEDIMIENTO;DESCR_PROCEDIMIENTO;LINEA;PROD_ID;DESCR_BIEN_SERVICIO;CANTIDAD;UNIDAD_MEDIDA;MONTO_UNITARIO;MONEDA_PRECIO_EST;MONEDA_ADJUDICADA;MONTO_ADJU_LINEA;MONTO_ADJU_LINEA_CRC;MONTO_ADJU_LINEA_USD;FECHA_ADJUD_FIRME;FECHA_SOL_CONTRA;CEDULA_PROVEEDOR;NOMBRE_PROVEEDOR;PERFIL_PROV;CEDULA_REPRESENTANTE;REPRESENTANTE;OBJETO_GASTO;NRO_SICOP;TIPO_PROCEDIMIENTO;MODALIDAD_PROCEDIMIENTO;fecha_rev;FECHA_SOL_CONTRA_CL;PROD_ID_CL',
  '"4000042139";"INSTITUTO COSTARRICENSE DE ELECTRICIDAD";"2025";"2025XE-000870-0000400001";"S.E Contratación Directa de Escasa Cuantía  /Adquisición de Cable de Potencia EDUS";6;" 2612163490028357";"CABLE DE COBRE FORRADO THHN # 10 AWG DE 7 HILOS COLOR VERDE";1.000;"m";530.690000;"CRC";"USD";"1.141300";"570.82000000000005";"1.1399999999999999";"08/01/2026";"25/11/2025";"3101343092";"ENERSYS MVA COSTA RICA SOCIEDAD ANONIMA";"Representantes Legales";"0105640457";"MARCO VINICIO VARGAS BARRIENTOS";"2.05.99";"20251103634";"PROCEDIMIENTOS ESPECIALES";"Según demanda";;"2025-11-25";"2612163490028357"',
  '"3101007749";"REFINADORA COSTARRICENSE DE PETRÓLEO SOCIEDAD ANÓNIMA";"2026";"2026LD-000038-0016700105";"Renovación de suscripciones Manageengine, por un año prorrogable por 3 periodos iguales. SOLPE 2026000022/CA20260054";3;" 8111220292399945";"RENOVACION DE LICENCIA DE SOFTWARE AD MANAGER PLUS";1.000;"NA";4740.350000;"USD";"USD";"4740.350000";"2194118.3999999999";"4740.3500000000004";"08/06/2026";"06/05/2026";"3101079786";"COASIN COSTA RICA SOCIEDAD ANONIMA";"Representantes Legales";"0106950381";"Francisco Duran Fernandez";"1.03.07";"20260500405";"LICITACIÓN REDUCIDA";"Servicios";;"2026-05-06";"8111220292399945"',
].join('\n');

describe('parseProcedimientoAdjudicacionCsv', () => {
  it('parsea correctamente una línea con moneda estimada distinta a la adjudicada', async () => {
    const rows = await parseProcedimientoAdjudicacionCsv(REAL_FIXTURE);
    const row = rows[0];

    expect(row).toMatchObject({
      nroSicop: '20251103634',
      linea: 6,
      anio: 2025,
      cedulaInstitucion: '4000042139',
      institucion: 'INSTITUTO COSTARRICENSE DE ELECTRICIDAD',
      tipoProcedimiento: 'PROCEDIMIENTOS ESPECIALES',
      modalidadProcedimiento: 'Según demanda',
      unidadMedida: 'm',
      monedaPrecioEstimado: 'CRC',
      monedaAdjudicada: 'USD',
      cedulaProveedor: '3101343092',
      nombreProveedor: 'ENERSYS MVA COSTA RICA SOCIEDAD ANONIMA',
      perfilProveedor: 'Representantes Legales',
      objetoGasto: '2.05.99',
      productoId: '2612163490028357',
    });
    expect(row.cantidad).toBe(1);
    expect(row.montoUnitario).toBeCloseTo(530.69, 2);
    expect(row.montoLineaAdjudicada).toBeCloseTo(1.1413, 4);
    expect(row.montoLineaAdjudicadaCrc).toBeCloseTo(570.82, 2);
    expect(row.montoLineaAdjudicadaUsd).toBeCloseTo(1.14, 2);
    // DD/MM/YYYY: "08/01/2026" es 8 de enero, no 1 de agosto.
    expect(row.fechaAdjudicacionFirme?.toISOString()).toBe('2026-01-08T00:00:00.000Z');
    // Tomada de FECHA_SOL_CONTRA_CL (ya normalizada por SICOP), no de FECHA_SOL_CONTRA.
    expect(row.fechaSolicitudContrato?.toISOString()).toBe('2025-11-25T00:00:00.000Z');
  });

  it('usa PROD_ID_CL (sin espacio inicial) en vez de PROD_ID crudo', async () => {
    const rows = await parseProcedimientoAdjudicacionCsv(REAL_FIXTURE);
    expect(rows[0].productoId).toBe('2612163490028357');
    expect(rows[0].productoId?.startsWith(' ')).toBe(false);
  });

  it('nunca incluye la identidad del representante legal (privacidad)', async () => {
    const rows = await parseProcedimientoAdjudicacionCsv(REAL_FIXTURE);
    const keys = Object.keys(rows[0]);
    expect(keys).not.toContain('cedulaRepresentante');
    expect(keys).not.toContain('representante');
  });

  it('parsea correctamente una línea con la misma moneda estimada y adjudicada', async () => {
    const rows = await parseProcedimientoAdjudicacionCsv(REAL_FIXTURE);
    const row = rows[1];
    expect(row.nroSicop).toBe('20260500405');
    expect(row.monedaPrecioEstimado).toBe('USD');
    expect(row.monedaAdjudicada).toBe('USD');
    expect(row.fechaAdjudicacionFirme?.toISOString()).toBe('2026-06-08T00:00:00.000Z');
    expect(row.fechaSolicitudContrato?.toISOString()).toBe('2026-05-06T00:00:00.000Z');
  });

  it('lanza SchemaMismatchError si el header real no coincide', async () => {
    const broken = REAL_FIXTURE.replace('MONEDA_ADJUDICADA;', '');
    await expect(parseProcedimientoAdjudicacionCsv(broken)).rejects.toThrow(SchemaMismatchError);
  });
});
