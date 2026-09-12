'use client';

import { useEffect, useState } from 'react';
import { getTseByCanton, getTseByDistrito, getTseByProvincia, getTseSummary } from '../tse.service';
import type { TseGeoCount, TseSummary } from '../tse.types';
import { TseGeoChart } from './TseGeoChart';
import { TseKpiCards } from './TseKpiCards';

export function TseDashboard() {
  const [summary, setSummary] = useState<TseSummary | null>(null);
  const [provincia, setProvincia] = useState<string | null>(null);
  const [canton, setCanton] = useState<string | null>(null);
  const [data, setData] = useState<TseGeoCount[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTseSummary()
      .then(setSummary)
      .catch(() => setError('No se pudo conectar con la API del observatorio.'));
  }, []);

  useEffect(() => {
    const onResult = (result: TseGeoCount[]) => {
      setError(null);
      setData(result);
    };

    if (provincia && canton) {
      getTseByDistrito(undefined, provincia, canton)
        .then(onResult)
        .catch(() => setError('No se pudo cargar la distribución por distrito.'));
    } else if (provincia) {
      getTseByCanton(undefined, provincia)
        .then(onResult)
        .catch(() => setError('No se pudo cargar la distribución por cantón.'));
    } else {
      getTseByProvincia()
        .then(onResult)
        .catch(() => setError('No se pudo cargar la distribución por provincia.'));
    }
  }, [provincia, canton]);

  const title = canton
    ? `Distritos electorales de ${canton}`
    : provincia
      ? `Cantones de ${provincia}`
      : 'Electores por provincia';

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <TseKpiCards summary={summary} />

      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => {
            setProvincia(null);
            setCanton(null);
          }}
          className={
            provincia
              ? 'text-zinc-500 hover:underline dark:text-zinc-400'
              : 'font-medium text-zinc-900 dark:text-zinc-50'
          }
        >
          Costa Rica
        </button>
        {provincia && (
          <>
            <span className="text-zinc-400">/</span>
            <button
              type="button"
              onClick={() => setCanton(null)}
              className={
                canton
                  ? 'text-zinc-500 hover:underline dark:text-zinc-400'
                  : 'font-medium text-zinc-900 dark:text-zinc-50'
              }
            >
              {provincia}
            </button>
          </>
        )}
        {canton && (
          <>
            <span className="text-zinc-400">/</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{canton}</span>
          </>
        )}
      </div>

      <TseGeoChart title={title} data={data} onSelect={canton ? undefined : provincia ? setCanton : setProvincia} />
    </div>
  );
}
