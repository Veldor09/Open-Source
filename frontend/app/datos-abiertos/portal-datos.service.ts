import { getApiUrl } from '@/lib/api';
import type {
  PortalDatasetDetail,
  PortalDatasetSummary,
  PronaeModalidadCount,
  PronaeSummary,
  PronaeTable,
  PronaeTrendPoint,
} from './portal-datos.types';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${getApiUrl()}${path}`);
  if (!res.ok) {
    throw new Error(`Error ${res.status} consultando ${path}`);
  }
  return res.json() as Promise<T>;
}

export function searchPortalDatasets(q?: string): Promise<{ total: number; datasets: PortalDatasetSummary[] }> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return getJson(`/portal-datos/datasets${qs}`);
}

export function getPortalDataset(id: string): Promise<PortalDatasetDetail> {
  return getJson(`/portal-datos/datasets/${encodeURIComponent(id)}`);
}

export function getPronaeYears(): Promise<number[]> {
  return getJson('/portal-datos/pronae/years');
}

export function getPronaeSummary(anio?: number): Promise<PronaeSummary> {
  return getJson(`/portal-datos/pronae/summary${anio ? `?anio=${anio}` : ''}`);
}

export function getPronaeByModalidad(anio?: number): Promise<PronaeModalidadCount[]> {
  return getJson(`/portal-datos/pronae/by-modality${anio ? `?anio=${anio}` : ''}`);
}

export function getPronaeTrend(): Promise<PronaeTrendPoint[]> {
  return getJson('/portal-datos/pronae/trend');
}

export function getPronaeTable(): Promise<PronaeTable> {
  return getJson('/portal-datos/pronae/table');
}
