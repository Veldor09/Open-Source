export interface OijSummary {
  totalRegistros: number;
  delitosDistintos: number;
  provinciasDistintas: number;
  fechaMinima: string | null;
  fechaMaxima: string | null;
}

export interface OijTrendPoint {
  mes: string;
  total: number;
}

export interface OijCrimeCount {
  delito: string;
  total: number;
}

export interface OijLocationCount {
  nombre: string;
  total: number;
}

export interface OijFilterOptions {
  delitos: string[];
  provincias: string[];
  cantones: string[];
  anios: number[];
}

export interface OijIncidenteRecord {
  id: string;
  delito: string;
  subDelito: string;
  fecha: string;
  anio: number;
  victima: string;
  subVictima: string;
  edad: string;
  nacionalidad: string;
  provincia: string;
  canton: string;
  distrito: string;
}

export interface OijRecordsResponse {
  rows: OijIncidenteRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type OijLocationLevel = 'provincia' | 'canton' | 'distrito';

export interface OijFilterState {
  anio?: number;
  fechaInicio?: string;
  fechaFin?: string;
  delito?: string;
  provincia?: string;
  canton?: string;
}
