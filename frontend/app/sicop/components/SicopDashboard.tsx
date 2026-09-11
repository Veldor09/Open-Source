'use client';

import { useEffect, useState } from 'react';
import { useVersionOnChange } from '@/lib/useVersionOnChange';
import { getSourceStatuses } from '@/services/sources.service';
import {
  getSicopCategories,
  getSicopCompetition,
  getSicopFilterOptions,
  getSicopInstitutions,
  getSicopRecords,
  getSicopSuppliers,
  getSicopSummary,
  getSicopTrends,
} from '../sicop.service';
import type {
  SicopCategories,
  SicopCompetition,
  SicopFilterOptions,
  SicopFilterState,
  SicopRecordsResponse,
  SicopSummary,
  SicopTopInstitution,
  SicopTopSupplier,
  SicopTrendPoint,
} from '../sicop.types';
import { SicopBarChart } from './SicopBarChart';
import { SicopCompetitionSection } from './SicopCompetitionSection';
import { SicopFilters } from './SicopFilters';
import { SicopKpiCards } from './SicopKpiCards';
import { SicopRecordsTable } from './SicopRecordsTable';
import { SicopTrendChart } from './SicopTrendChart';

const PAGE_SIZE = 15;

export function SicopDashboard() {
  const [filterOptions, setFilterOptions] = useState<SicopFilterOptions | null>(null);
  const [filters, setFilters] = useState<SicopFilterState>({});
  const [page, setPage] = useState(1);

  const [summary, setSummary] = useState<SicopSummary | null>(null);
  const [trends, setTrends] = useState<SicopTrendPoint[]>([]);
  const [institutions, setInstitutions] = useState<SicopTopInstitution[]>([]);
  const [suppliers, setSuppliers] = useState<SicopTopSupplier[]>([]);
  const [categories, setCategories] = useState<SicopCategories | null>(null);
  const [competition, setCompetition] = useState<SicopCompetition | null>(null);
  const [records, setRecords] = useState<SicopRecordsResponse | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Volver a la página 1 cuando cambian los filtros, ajustando el estado
  // durante el render (patrón de https://react.dev/learn/you-might-not-need-an-effect)
  // en vez de un useEffect con setState síncrono — ver useVersionOnChange.ts.
  const [prevFilters, setPrevFilters] = useState(filters);
  if (filters !== prevFilters) {
    setPrevFilters(filters);
    if (page !== 1) setPage(1);
  }

  const fetchVersion = useVersionOnChange(filters, page);
  const [loadedVersion, setLoadedVersion] = useState(0);
  const loading = fetchVersion !== loadedVersion;

  useEffect(() => {
    getSicopFilterOptions()
      .then(setFilterOptions)
      .catch(() => setError('No se pudo conectar con la API del observatorio.'));
    getSourceStatuses()
      .then((statuses) => setUltimaActualizacion(statuses?.find((s) => s.sourceKey === 'sicop')?.retrievedAt ?? null))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getSicopSummary(filters),
      getSicopTrends(filters),
      getSicopInstitutions(filters),
      getSicopSuppliers(filters),
      getSicopCategories(filters),
      getSicopCompetition(filters),
      getSicopRecords(filters, page, PAGE_SIZE),
    ])
      .then(([summaryRes, trendsRes, institutionsRes, suppliersRes, categoriesRes, competitionRes, recordsRes]) => {
        if (cancelled) return;
        setSummary(summaryRes);
        setTrends(trendsRes);
        setInstitutions(institutionsRes);
        setSuppliers(suppliersRes);
        setCategories(categoriesRes);
        setCompetition(competitionRes);
        setRecords(recordsRes);
        setError(null);
        setLoadedVersion(fetchVersion);
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudo conectar con la API del observatorio. Intenta de nuevo más tarde.');
          setLoadedVersion(fetchVersion);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchVersion, filters, page]);

  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
        Fuente: SICOP (réplica pública de{' '}
        <a href="https://www.observatoriocomprapublica.go.cr/descargas-sicop/" target="_blank" rel="noopener noreferrer" className="underline">
          observatoriocomprapublica.go.cr
        </a>
        ). Esta réplica puede ir hasta 24 horas detrás del sistema SICOP principal, y algunos reportes de proveedores
        pueden excluir registros muy recientes.{' '}
        {ultimaActualizacion &&
          `Última importación a este observatorio: ${new Date(ultimaActualizacion).toLocaleString('es-CR')}.`}
      </p>

      <SicopFilters options={filterOptions} value={filters} onChange={setFilters} />

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <SicopKpiCards summary={summary} />

      <SicopTrendChart data={trends} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SicopBarChart title="Top instituciones por monto adjudicado" data={institutions} />
        <SicopBarChart
          title="Top proveedores por monto adjudicado"
          data={suppliers.map((s) => ({ nombre: s.nombre, montoCrc: s.montoCrc }))}
        />
      </div>

      {categories && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SicopBarChart title="Por tipo de procedimiento" data={categories.porTipoProcedimiento} />
          <SicopBarChart title="Por modalidad" data={categories.porModalidad} />
          <SicopBarChart title="Bienes vs. servicios" data={categories.porClasificacionObjeto} />
        </div>
      )}

      <SicopCompetitionSection data={competition} />

      {records && (
        <SicopRecordsTable
          rows={records.rows}
          total={records.total}
          page={records.page}
          totalPages={records.totalPages}
          onPageChange={setPage}
        />
      )}

      {loading && <p className="text-sm text-zinc-400">Actualizando datos...</p>}
    </div>
  );
}
