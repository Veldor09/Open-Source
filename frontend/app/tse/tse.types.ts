export interface TseSummary {
  fechaSnapshot: string;
  totalElectores: number;
  totalProvincias: number;
  totalCantones: number;
  totalDistritos: number;
}

export interface TseGeoCount {
  nombre: string;
  cantidadElectores: number;
}

export interface TseFilterOptions {
  provincias: string[];
  cantonesPorProvincia: Record<string, string[]>;
}
