export const OIJ_CKAN_BASE_URL = 'https://datosabiertospj.poder-judicial.go.cr';
export const OIJ_CKAN_PACKAGE_ID = 'estadisticas-policiales';
export const OIJ_SOURCE_KEY = 'oij';
export const OIJ_INSTITUTION = 'Organismo de Investigación Judicial (OIJ) / Poder Judicial de Costa Rica';
export const OIJ_OFFICIAL_URL = `${OIJ_CKAN_BASE_URL}/dataset/${OIJ_CKAN_PACKAGE_ID}`;

/**
 * Cantidad real de columnas por fila en el CSV del OIJ: 10 campos con datos
 * (Delito, SubDelito, Fecha, Victima, SubVictima, Edad, Nacionalidad,
 * Provincia, Canton, Distrito) más una columna extra siempre vacía entre
 * Edad y Nacionalidad. Verificado contra el XSD del recurso XML y contra
 * muestras reales de 2015, 2018, 2020, 2023 y 2026 — no hay Hora ni
 * Sexo/Genero en la fuente actual.
 */
export const OIJ_CSV_COLUMN_COUNT = 11;
