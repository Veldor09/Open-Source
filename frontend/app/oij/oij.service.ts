import { getApiUrl } from '@/lib/api';
import type {
  OijCrimeCount,
  OijFilterOptions,
  OijFilterState,
  OijLocationCount,
  OijLocationLevel,
  OijRecordsResponse,
  OijSummary,
  OijTrendPoint,
} from './oij.types';

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

export function getOijSummary(filters: OijFilterState): Promise<OijSummary> {
  return getJson(`/oij/summary${buildQuery(filters)}`);
}

export function getOijTrends(filters: OijFilterState): Promise<OijTrendPoint[]> {
  return getJson(`/oij/trends${buildQuery(filters)}`);
}

export function getOijCrimes(filters: OijFilterState): Promise<OijCrimeCount[]> {
  return getJson(`/oij/crimes${buildQuery(filters)}`);
}

export function getOijLocations(
  filters: OijFilterState,
  nivel: OijLocationLevel = 'provincia',
): Promise<OijLocationCount[]> {
  return getJson(`/oij/locations${buildQuery({ ...filters, nivel })}`);
}

export function getOijFilterOptions(): Promise<OijFilterOptions> {
  return getJson('/oij/filters');
}

export function getOijRecords(
  filters: OijFilterState,
  page: number,
  pageSize: number,
): Promise<OijRecordsResponse> {
  return getJson(`/oij/records${buildQuery({ ...filters, page, pageSize })}`);
}
