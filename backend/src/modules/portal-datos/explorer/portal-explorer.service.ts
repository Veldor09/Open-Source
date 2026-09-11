import { Injectable } from '@nestjs/common';
import { ckanPackageSearch, ckanPackageShow } from '../../../common/ckan/ckan-client.js';
import { PORTAL_CKAN_BASE_URL } from '../portal-datos.constants.js';

export interface PortalDatasetSummary {
  id: string;
  titulo: string;
  institucion: string | null;
  grupos: string[];
  licencia: string | null;
  actualizado: string;
  formatos: string[];
  cantidadRecursos: number;
}

export interface PortalDatasetDetail extends PortalDatasetSummary {
  descripcion: string | null;
  etiquetas: string[];
  recursos: {
    id: string;
    nombre: string;
    formato: string;
    url: string;
    actualizado: string;
  }[];
}

/**
 * Explorador en vivo del catálogo CKAN del Portal Nacional de Datos
 * Abiertos. No persiste nada: el catálogo completo son ~13 datasets al
 * momento de escribir esto, así que consultarlo en cada request es
 * razonable (a diferencia de PRONAE, que sí se importa a la base local).
 */
@Injectable()
export class PortalExplorerService {
  async search(query?: string): Promise<{ total: number; datasets: PortalDatasetSummary[] }> {
    const result = await ckanPackageSearch(PORTAL_CKAN_BASE_URL, { q: query, rows: 50 });

    return {
      total: result.count,
      datasets: result.results.map((pkg) => ({
        id: pkg.name,
        titulo: pkg.title,
        institucion: pkg.organization?.title ?? null,
        grupos: (pkg.groups ?? []).map((g) => g.title),
        licencia: pkg.license_title || null,
        actualizado: pkg.metadata_modified,
        formatos: [...new Set(pkg.resources.map((r) => r.format))],
        cantidadRecursos: pkg.resources.length,
      })),
    };
  }

  async getDataset(id: string): Promise<PortalDatasetDetail> {
    const pkg = await ckanPackageShow(PORTAL_CKAN_BASE_URL, id);

    return {
      id: pkg.name,
      titulo: pkg.title,
      descripcion: pkg.notes ?? null,
      institucion: pkg.organization?.title ?? null,
      grupos: (pkg.groups ?? []).map((g) => g.title),
      licencia: pkg.license_title || null,
      actualizado: pkg.metadata_modified,
      etiquetas: (pkg.tags ?? []).map((t) => t.name),
      formatos: [...new Set(pkg.resources.map((r) => r.format))],
      cantidadRecursos: pkg.resources.length,
      recursos: pkg.resources.map((r) => ({
        id: r.id,
        nombre: r.name,
        formato: r.format,
        url: r.url,
        actualizado: r.last_modified,
      })),
    };
  }
}
