import { getApiUrl } from '@/lib/api';
import type {
  SicopCategories,
  SicopCompetition,
  SicopCompetitionFilterState,
  SicopFilterOptions,
  SicopFilterState,
  SicopRecordsResponse,
  SicopSummary,
  SicopTopInstitution,
  SicopTopSupplier,
  SicopTrendPoint,
} from './sicop.types';

function buildQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params) as [string, string | number | undefined][]) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${getApiUrl()}${path}`);
  if (!res.ok) {
    throw new Error(`Error ${res.status} consultando ${path}`);
  }
  return res.json() as Promise<T>;
}

export function getSicopSummary(filters: SicopFilterState): Promise<SicopSummary> {
  return getJson(`/sicop/summary${buildQuery(filters)}`);
}

export function getSicopTrends(filters: SicopFilterState): Promise<SicopTrendPoint[]> {
  return getJson(`/sicop/trends${buildQuery(filters)}`);
}

export function getSicopInstitutions(filters: SicopFilterState): Promise<SicopTopInstitution[]> {
  return getJson(`/sicop/institutions${buildQuery(filters)}`);
}

export function getSicopSuppliers(filters: SicopFilterState): Promise<SicopTopSupplier[]> {
  return getJson(`/sicop/suppliers${buildQuery(filters)}`);
}

export function getSicopCategories(filters: SicopFilterState): Promise<SicopCategories> {
  return getJson(`/sicop/categories${buildQuery(filters)}`);
}

export function getSicopFilterOptions(): Promise<SicopFilterOptions> {
  return getJson('/sicop/filters');
}

export function getSicopRecords(
  filters: SicopFilterState,
  page: number,
  pageSize: number,
): Promise<SicopRecordsResponse> {
  return getJson(`/sicop/records${buildQuery({ ...filters, page, pageSize })}`);
}

export function getSicopCompetition(filters: SicopCompetitionFilterState): Promise<SicopCompetition> {
  return getJson(`/sicop/competition${buildQuery(filters)}`);
}
