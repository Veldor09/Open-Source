'use client';

import { useEffect, useState } from 'react';
import { useVersionOnChange } from '@/lib/useVersionOnChange';
import {
  getOijCrimes,
  getOijFilterOptions,
  getOijLocations,
  getOijRecords,
  getOijSummary,
  getOijTrends,
} from '../oij.service';
import type {
  OijCrimeCount,
  OijFilterOptions,
  OijFilterState,
  OijLocationCount,
  OijLocationLevel,
  OijRecordsResponse,
  OijSummary,
  OijTrendPoint,
} from '../oij.types';
import { OijCrimesChart } from './OijCrimesChart';
import { OijFilters } from './OijFilters';
import { OijKpiCards } from './OijKpiCards';
import { OijLocationsChart } from './OijLocationsChart';
import { OijRecordsTable } from './OijRecordsTable';
import { OijTrendChart } from './OijTrendChart';

const PAGE_SIZE = 15;

export function OijDashboard() {
  const [filterOptions, setFilterOptions] = useState<OijFilterOptions | null>(null);
  const [filters, setFilters] = useState<OijFilterState>({});
  const [nivel, setNivel] = useState<OijLocationLevel>('provincia');
  const [page, setPage] = useState(1);

  const [summary, setSummary] = useState<OijSummary | null>(null);
  const [trends, setTrends] = useState<OijTrendPoint[]>([]);
  const [crimes, setCrimes] = useState<OijCrimeCount[]>([]);
  const [locations, setLocations] = useState<OijLocationCount[]>([]);
  const [records, setRecords] = useState<OijRecordsResponse | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Volver a la página 1 cuando cambian los filtros. Se ajusta el estado
  // durante el render (en vez de en un useEffect) siguiendo el patrón de
  // https://react.dev/learn/you-might-not-need-an-effect — evita el
  // setState síncrono al inicio de un efecto que exige `react-hooks/set-state-in-effect`.
  const [prevFilters, setPrevFilters] = useState(filters);
  if (filters !== prevFilters) {
    setPrevFilters(filters);
    if (page !== 1) setPage(1);
  }

  // "loading" se deriva comparando la versión de la solicitud en curso
  // contra la última que terminó, en vez de un `setLoading(true)` síncrono
  // al inicio del efecto de carga (mismo motivo que arriba).
  const fetchVersion = useVersionOnChange(filters, nivel, page);
  const [loadedVersion, setLoadedVersion] = useState(0);
  const loading = fetchVersion !== loadedVersion;

  useEffect(() => {
    getOijFilterOptions()
      .then(setFilterOptions)
      .catch(() => setError('No se pudo conectar con la API del observatorio.'));
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getOijSummary(filters),
      getOijTrends(filters),
      getOijCrimes(filters),
      getOijLocations(filters, nivel),
      getOijRecords(filters, page, PAGE_SIZE),
    ])
      .then(([summaryRes, trendsRes, crimesRes, locationsRes, recordsRes]) => {
        if (cancelled) return;
        setSummary(summaryRes);
        setTrends(trendsRes);
        setCrimes(crimesRes);
        setLocations(locationsRes);
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
  }, [fetchVersion, filters, nivel, page]);

  return (
    <div className="flex flex-col gap-6">
      <OijFilters options={filterOptions} value={filters} onChange={setFilters} />

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <OijKpiCards summary={summary} />

      <OijTrendChart data={trends} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OijCrimesChart data={crimes} />
        <OijLocationsChart data={locations} nivel={nivel} onNivelChange={setNivel} />
      </div>

      {records && (
        <OijRecordsTable
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
