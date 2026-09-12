import { getApiUrl } from '@/lib/api';
import type { TseFilterOptions, TseGeoCount, TseSummary } from './tse.types';

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
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

export function getTseSnapshots(): Promise<string[]> {
  return getJson('/tse/snapshots');
}

export function getTseSummary(fecha?: string): Promise<TseSummary> {
  return getJson(`/tse/summary${buildQuery({ fecha })}`);
}

export function getTseByProvincia(fecha?: string): Promise<TseGeoCount[]> {
  return getJson(`/tse/by-provincia${buildQuery({ fecha })}`);
}

export function getTseByCanton(fecha: string | undefined, provincia: string): Promise<TseGeoCount[]> {
  return getJson(`/tse/by-canton${buildQuery({ fecha, provincia })}`);
}

export function getTseByDistrito(
  fecha: string | undefined,
  provincia: string,
  canton: string,
): Promise<TseGeoCount[]> {
  return getJson(`/tse/by-distrito${buildQuery({ fecha, provincia, canton })}`);
}

export function getTseFilterOptions(): Promise<TseFilterOptions> {
  return getJson('/tse/filters');
}
