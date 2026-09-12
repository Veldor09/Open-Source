'use client';

import { useEffect, useState } from 'react';
import {
  getPronaeByModalidad,
  getPronaeSummary,
  getPronaeTable,
  getPronaeTrend,
  getPronaeYears,
} from '../portal-datos.service';
import type {
  PronaeModalidadCount,
  PronaeSummary,
  PronaeTable as PronaeTableData,
  PronaeTrendPoint,
} from '../portal-datos.types';
import { PronaeKpiCards } from './PronaeKpiCards';
import { PronaeModalidadChart } from './PronaeModalidadChart';
import { PronaeTable } from './PronaeTable';
import { PronaeTrendChart } from './PronaeTrendChart';
import { PronaeYearTabs } from './PronaeYearTabs';

export function PronaeDashboard() {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [summary, setSummary] = useState<PronaeSummary | null>(null);
  const [byModalidad, setByModalidad] = useState<PronaeModalidadCount[]>([]);
  const [trend, setTrend] = useState<PronaeTrendPoint[]>([]);
  const [table, setTable] = useState<PronaeTableData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPronaeYears()
      .then((y) => {
        setYears(y);
        if (y.length > 0) setSelectedYear(y[y.length - 1]);
      })
      .catch(() => setError('No se pudo conectar con la API del observatorio.'));
    getPronaeTrend()
      .then(setTrend)
      .catch(() => undefined);
    getPronaeTable()
      .then(setTable)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (selectedYear === undefined) return;
    getPronaeSummary(selectedYear)
      .then(setSummary)
      .catch(() => setError('No se pudo cargar el resumen de PRONAE.'));
    getPronaeByModalidad(selectedYear)
      .then(setByModalidad)
      .catch(() => undefined);
  }, [selectedYear]);

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {years.length > 0 && selectedYear !== undefined && (
        <PronaeYearTabs years={years} selected={selectedYear} onSelect={setSelectedYear} />
      )}

      <PronaeKpiCards summary={summary} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PronaeModalidadChart data={byModalidad} />
        <PronaeTrendChart data={trend} />
      </div>

      <PronaeTable data={table} />
    </div>
  );
}
