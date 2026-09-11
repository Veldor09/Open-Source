export interface SicopFilterState {
  anio?: number;
  fechaInicio?: string;
  fechaFin?: string;
  institucion?: string;
  proveedor?: string;
  tipoProcedimiento?: string;
  modalidadProcedimiento?: string;
  moneda?: string;
}

export interface SicopMonedaCount {
  moneda: string;
  totalLineas: number;
  montoOriginal: number;
}

export interface SicopSummary {
  totalLineas: number;
  totalProcedimientos: number;
  institucionesDistintas: number;
  proveedoresDistintos: number;
  montoTotalAdjudicadoCrc: number;
  lineasSinEquivalenteCrc: number;
  fechaMinima: string | null;
  fechaMaxima: string | null;
  porMoneda: SicopMonedaCount[];
}

export interface SicopTrendPoint {
  mes: string;
  montoCrc: number;
  totalLineas: number;
}

export interface SicopTopInstitution {
  cedula: string;
  nombre: string;
  montoCrc: number;
  totalLineas: number;
}

export interface SicopTopSupplier extends SicopTopInstitution {
  tipoProveedor: string | null;
  tamanoProveedor: string | null;
}

export interface SicopCategoryCount {
  nombre: string;
  montoCrc: number;
  totalLineas: number;
}

export interface SicopCategories {
  porTipoProcedimiento: SicopCategoryCount[];
  porModalidad: SicopCategoryCount[];
  porClasificacionObjeto: SicopCategoryCount[];
}

export interface SicopFilterOptions {
  tiposProcedimiento: string[];
  modalidades: string[];
  monedas: string[];
  anios: number[];
}

export interface SicopLineaAdjudicadaRecord {
  id: string;
  nroSicop: string;
  linea: number;
  anio: number;
  institucion: string;
  numeroProcedimiento: string;
  tipoProcedimiento: string;
  modalidadProcedimiento: string;
  descripcionBienServicio: string;
  cantidad: number;
  unidadMedida: string;
  monedaAdjudicada: string;
  montoLineaAdjudicada: number;
  montoLineaAdjudicadaCrc: number | null;
  fechaAdjudicacionFirme: string | null;
  nombreProveedor: string;
}

export interface SicopRecordsResponse {
  rows: SicopLineaAdjudicadaRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SicopCompetitionFilterState {
  anio?: number;
  fechaInicio?: string;
  fechaFin?: string;
  proveedor?: string;
}

export interface SicopCompetitionBucket {
  proveedores: string;
  procedimientos: number;
}

export interface SicopCompetitionTop {
  nroSicop: string;
  proveedoresDistintos: number;
  totalOfertas: number;
}

export interface SicopCompetition {
  totalProcedimientos: number;
  promedioProveedoresPorProcedimiento: number;
  procedimientosUnProveedor: number;
  porcentajeUnProveedor: number;
  distribucion: SicopCompetitionBucket[];
  masCompetidos: SicopCompetitionTop[];
}
