export const PORTAL_CKAN_BASE_URL = 'https://datosabiertos.gob.go.cr';
export const PRONAE_PACKAGE_ID = 'mtss-personas-beneficiarias-pronae-2021-2024';
export const PORTAL_SOURCE_KEY = 'portal-pronae';
export const PORTAL_INSTITUTION =
  'Ministerio de Trabajo y Seguridad Social (MTSS) — vía Portal Nacional de Datos Abiertos';
export const PORTAL_OFFICIAL_URL = `${PORTAL_CKAN_BASE_URL}/dataset/${PRONAE_PACKAGE_ID}`;

/**
 * Nombre de la fila que la fuente publica como verificación (suma de las
 * demás modalidades). No se persiste como una modalidad más — ver
 * parsing/pronae-xlsx.parser.ts.
 */
export const PRONAE_TOTAL_ROW_LABEL = 'TOTAL';
