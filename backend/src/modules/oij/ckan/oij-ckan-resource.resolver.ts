import { ckanPackageShow } from '../../../common/ckan/ckan-client.js';
import { CkanResource } from '../../../common/ckan/ckan.types.js';
import { OIJ_CKAN_BASE_URL, OIJ_CKAN_PACKAGE_ID } from '../oij.constants.js';

/**
 * Descubre la URL real del CSV para un año mediante CKAN (package_show),
 * en vez de asumir/hardcodear el patrón de URL del blob storage del PJ.
 */
export async function findOijCsvResourceForYear(year: number): Promise<CkanResource> {
  const pkg = await ckanPackageShow(OIJ_CKAN_BASE_URL, OIJ_CKAN_PACKAGE_ID);

  const csvResources = pkg.resources.filter((r) => r.format.toUpperCase() === 'CSV');
  const resource = csvResources.find((r) => r.name.includes(String(year)));

  if (!resource) {
    const disponibles = csvResources.map((r) => r.name).join(', ') || '(ninguno)';
    throw new Error(
      `No se encontró un recurso CSV para el año ${year} en el dataset CKAN "${OIJ_CKAN_PACKAGE_ID}". ` +
        `Recursos CSV disponibles: ${disponibles}`,
    );
  }

  return resource;
}
