export const TSE_PADRON_ZIP_URL = 'https://www.tse.go.cr/zip/padron/padron_completo.zip';
export const TSE_SOURCE_KEY = 'tse-padron';
export const TSE_INSTITUTION = 'Tribunal Supremo de Elecciones (TSE)';
export const TSE_OFFICIAL_URL = 'https://www.tse.go.cr/descarga_padron.html';

/** Nombres reales verificados dentro del ZIP (no siempre coinciden en mayúsculas con LEAME.txt). */
export const PADRON_ENTRY_PATTERN = /^padron_completo\.txt$/i;
export const DISTELEC_ENTRY_PATTERN = /^distelec\.txt$/i;
export const LEAME_ENTRY_PATTERN = /^leame\.txt$/i;

/**
 * CEDULA(9), CODELEC(6), RELLENO(1), FECHACADUC(8), JUNTA(5), NOMBRE(30),
 * 1.APELLIDO(26), 2.APELLIDO(26) — verificado contra LEAME.txt y contra
 * datos reales del padrón. El importador solo usa CODELEC (índice 1); el
 * resto (incluida toda la identidad de la persona) se descarta de inmediato.
 */
export const PADRON_FIELD_COUNT = 8;
export const PADRON_CODELEC_FIELD_INDEX = 1;

/** CODELEC(6), PROVINCIA(10), CANTON(20), DISTRITO(34) — verificado contra LEAME.txt. */
export const DISTELEC_FIELD_COUNT = 4;

export const PROVINCIA_DESCONOCIDA = 'DESCONOCIDO';
export const CANTON_DESCONOCIDO = 'DESCONOCIDO';
export const DISTRITO_DESCONOCIDO = 'DESCONOCIDO';
