'use client';

import { useEffect, useState } from 'react';
import { useVersionOnChange } from '@/lib/useVersionOnChange';
import { getPortalDataset, searchPortalDatasets } from '../portal-datos.service';
import type { PortalDatasetDetail, PortalDatasetSummary } from '../portal-datos.types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function PortalExplorer() {
  const [query, setQuery] = useState('');
  const [datasets, setDatasets] = useState<PortalDatasetSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PortalDatasetDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const requestVersion = useVersionOnChange(query);
  const [loadedVersion, setLoadedVersion] = useState(0);
  const loading = requestVersion !== loadedVersion;

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      searchPortalDatasets(query || undefined)
        .then((res) => {
          if (cancelled) return;
          setDatasets(res.datasets);
          setTotal(res.total);
          setError(null);
          setLoadedVersion(requestVersion);
        })
        .catch(() => {
          if (!cancelled) {
            setError('No se pudo consultar el catálogo del Portal Nacional.');
            setLoadedVersion(requestVersion);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [requestVersion, query]);

  const toggleDataset = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetail(null);
    setDetailLoading(true);
    getPortalDataset(id)
      .then(setDetail)
      .catch(() => setError('No se pudo cargar el detalle de este dataset.'))
      .finally(() => setDetailLoading(false));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="text-sm text-zinc-600 dark:text-zinc-400" htmlFor="portal-search">
          Buscar en el catálogo ({total} datasets)
        </label>
        <input
          id="portal-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por institución, tema..."
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {datasets.map((ds) => (
          <div
            key={ds.id}
            className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          >
            <button
              type="button"
              onClick={() => toggleDataset(ds.id)}
              className="flex w-full flex-col gap-2 p-4 text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">{ds.titulo}</h3>
                <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {ds.formatos.join(', ') || 'sin recursos'}
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {ds.institucion ?? 'Institución no especificada'}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
                {ds.grupos.length > 0 && <span>Grupo: {ds.grupos.join(', ')}</span>}
                {ds.licencia && <span>Licencia: {ds.licencia}</span>}
                <span>Actualizado: {formatDate(ds.actualizado)}</span>
              </div>
            </button>

            {expandedId === ds.id && (
              <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
                {detailLoading && <p className="text-sm text-zinc-400">Cargando detalle...</p>}
                {detail && (
                  <div className="flex flex-col gap-2">
                    {detail.descripcion && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{detail.descripcion}</p>
                    )}
                    {detail.etiquetas.length > 0 && (
                      <p className="text-xs text-zinc-400">Etiquetas: {detail.etiquetas.join(', ')}</p>
                    )}
                    <div className="mt-2 flex flex-col gap-1">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Recursos:</p>
                      {detail.recursos.map((r) => (
                        <a
                          key={r.id}
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                        >
                          {r.nombre} ({r.formato})
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {!loading && datasets.length === 0 && !error && <p className="text-sm text-zinc-400">Sin resultados.</p>}
      </div>
    </div>
  );
}
