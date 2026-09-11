export const SICOP_SOURCE_KEY = 'sicop';
export const SICOP_INSTITUTION = 'Sistema Integrado de Compras Públicas (SICOP) / Ministerio de Hacienda';
export const SICOP_OFFICIAL_URL = 'https://www.sicop.go.cr';

/**
 * SICOP.go.cr (WAF + bug de CORS en producción, verificado el 11/09/2026) no
 * permite descarga programática pública en este momento. El propio
 * Observatorio de la Contratación Pública (RACSA/MH) publica una réplica
 * mensual, sin autenticación, documentada en
 * https://www.observatoriocomprapublica.go.cr/descargas-sicop/ — este es el
 * mecanismo público y legítimo que usa este módulo (no es scraping: la URL
 * es un patrón documentado explícitamente por esa página oficial-adjacente).
 */
export function buildSicopZipUrl(periodo: string): string {
  return `https://dlsaobservatorioprod.blob.core.windows.net/fs-synapse-observatorio-produccion/Zip/${periodo}.zip`;
}

/** Primer período con datos según observatoriocomprapublica.go.cr (verificado, no asumido). */
export const SICOP_FIRST_PERIOD = '201001';

const PERIODO_PATTERN = /^\d{6}$/;

export function isValidPeriodo(periodo: string): boolean {
  if (!PERIODO_PATTERN.test(periodo)) return false;
  const month = Number(periodo.slice(4, 6));
  return month >= 1 && month <= 12 && periodo >= SICOP_FIRST_PERIOD;
}

export function currentPeriodo(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Nombres reales verificados dentro del ZIP mensual (agosto 2026, 24 CSV en
 * total). Este módulo solo importa estos 4 — el resto (OrdenPedido,
 * InvitacionProcedimiento, Ofertas, Garantias, SancionProveedores,
 * RecursosObjecion, FechaPorEtapas, etc.) queda documentado como fase 2 en
 * el README, no se descarga ni se procesa.
 */
export const DETALLE_CARTELES_ENTRY = 'DetalleCarteles.csv';
export const PROCEDIMIENTO_ADJUDICACION_ENTRY = 'ProcedimientoAdjudicacion.csv';
export const INSTITUCIONES_REGISTRADAS_ENTRY = 'InstitucionesRegistradas.csv';
export const PROVEEDORES_ENTRY = 'Proveedores.csv';
export const OFERTAS_ENTRY = 'Ofertas.csv';

/**
 * Encabezados reales verificados por inspección directa de una muestra real
 * (agosto 2026). Delimitador `;` y codificación UTF-8 en los 4 archivos
 * (a diferencia de OIJ/PRONAE/TSE, SICOP NO usa Latin-1 — verificado con
 * `file`, no asumido). Si el header real no calza exactamente con esto, el
 * importador falla con SchemaMismatchError en vez de importar en silencio.
 */
export const DETALLE_CARTELES_HEADER = [
  'NRO_SICOP',
  'CEDULA_INSTITUCION',
  'FECHA_PUBLICACION',
  'NRO_PROCEDIMIENTO',
  'TIPO_PROCEDIMIENTO',
  'MODALIDAD_PROCEDIMIENTO',
  'CARTEL_STAT',
  'CARTEL_NM',
  'FECHAH_APERTURA',
  'CODIGO_BPIP',
  'CLAS_OBJ',
  'COD_EXCEPCION',
  'DES_EXCEPCION',
  'MONTO_EST',
  'FECHA_MOD',
];

export const PROCEDIMIENTO_ADJUDICACION_HEADER = [
  'CEDULA',
  'INSTITUCION',
  'ANO',
  'NUMERO_PROCEDIMIENTO',
  'DESCR_PROCEDIMIENTO',
  'LINEA',
  'PROD_ID',
  'DESCR_BIEN_SERVICIO',
  'CANTIDAD',
  'UNIDAD_MEDIDA',
  'MONTO_UNITARIO',
  'MONEDA_PRECIO_EST',
  'MONEDA_ADJUDICADA',
  'MONTO_ADJU_LINEA',
  'MONTO_ADJU_LINEA_CRC',
  'MONTO_ADJU_LINEA_USD',
  'FECHA_ADJUD_FIRME',
  'FECHA_SOL_CONTRA',
  'CEDULA_PROVEEDOR',
  'NOMBRE_PROVEEDOR',
  'PERFIL_PROV',
  'CEDULA_REPRESENTANTE',
  'REPRESENTANTE',
  'OBJETO_GASTO',
  'NRO_SICOP',
  'TIPO_PROCEDIMIENTO',
  'MODALIDAD_PROCEDIMIENTO',
  'fecha_rev',
  'FECHA_SOL_CONTRA_CL',
  'PROD_ID_CL',
];

export const INSTITUCIONES_REGISTRADAS_HEADER = [
  'CEDULA',
  'NOMBRE_INSTITUCION',
  'ZONA_GEO_INST',
  'FECHA_INGRESO',
  'FECHA_MOD',
];

export const PROVEEDORES_HEADER = [
  'CEDULA_PROVEEDOR',
  'NOMBRE_PROVEEDOR',
  'TIPO_PROVEEDOR',
  'TAMAÑO_PROVEEDOR',
  'FECHA_CONSTITUCION',
  'FECHA_EXPIRACION',
  'zona_geo_prov',
  'fecha_registro',
  'fecha_mod',
];

export const OFERTAS_HEADER = [
  'NRO_SICOP',
  'NRO_OFERTA',
  'CEDULA_PROVEEDOR',
  'FECHA_PRESENTA_OFERTA',
  'TIPO_OFERTA',
  'ID_CONSORCIO',
];
