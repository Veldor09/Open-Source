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

export interface PortalDatasetResource {
  id: string;
  nombre: string;
  formato: string;
  url: string;
  actualizado: string;
}

export interface PortalDatasetDetail extends PortalDatasetSummary {
  descripcion: string | null;
  etiquetas: string[];
  recursos: PortalDatasetResource[];
}

export interface PronaeSummary {
  anio: number;
  totalBeneficiarios: number;
  modalidadesActivas: number;
  modalidadPrincipal: { modalidad: string; cantidad: number } | null;
}

export interface PronaeModalidadCount {
  modalidad: string;
  cantidad: number;
}

export interface PronaeTrendPoint {
  anio: number;
  total: number;
}

export interface PronaeTableRow {
  modalidad: string;
  valores: Record<string, number>;
}

export interface PronaeTable {
  anios: number[];
  tabla: PronaeTableRow[];
}
