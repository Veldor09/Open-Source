import { CkanActionResponse, CkanPackageSearchResult, CkanPackageShowResult } from './ckan.types.js';

/**
 * Cliente mínimo para la Action API de CKAN (https://docs.ckan.org/en/2.11/api/).
 * Genérico a propósito: cualquier portal CKAN (Poder Judicial, Portal Nacional...)
 * expone la misma forma de respuesta.
 */
async function ckanGet<T>(baseUrl: string, action: string, search: URLSearchParams): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/3/action/${action}?${search.toString()}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new Error(`CKAN ${action} falló en ${baseUrl}: HTTP ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as CkanActionResponse<T>;
  if (!body.success) {
    throw new Error(`CKAN ${action} respondió success=false: ${body.error?.message ?? 'sin detalle'}`);
  }

  return body.result;
}

export async function ckanPackageShow(baseUrl: string, packageId: string): Promise<CkanPackageShowResult> {
  const search = new URLSearchParams({ id: packageId });
  return ckanGet<CkanPackageShowResult>(baseUrl, 'package_show', search);
}

export interface CkanPackageSearchParams {
  q?: string;
  rows?: number;
  start?: number;
}

export async function ckanPackageSearch(
  baseUrl: string,
  params: CkanPackageSearchParams = {},
): Promise<CkanPackageSearchResult> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  search.set('rows', String(params.rows ?? 20));
  search.set('start', String(params.start ?? 0));

  return ckanGet<CkanPackageSearchResult>(baseUrl, 'package_search', search);
}
