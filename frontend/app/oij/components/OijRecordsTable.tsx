'use client';

import type { OijIncidenteRecord } from '../oij.types';

interface OijRecordsTableProps {
  rows: OijIncidenteRecord[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function OijRecordsTable({ rows, total, page, totalPages, onPageChange }: OijRecordsTableProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Registros ({total.toLocaleString('es-CR')})
        </h3>
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-md border border-zinc-300 px-2 py-1 disabled:opacity-40 dark:border-zinc-700"
          >
            Anterior
          </button>
          <span>
            Página {page} de {totalPages || 1}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-md border border-zinc-300 px-2 py-1 disabled:opacity-40 dark:border-zinc-700"
          >
            Siguiente
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="py-2 pr-4 font-medium">Fecha</th>
              <th className="py-2 pr-4 font-medium">Delito</th>
              <th className="py-2 pr-4 font-medium">Subdelito</th>
              <th className="py-2 pr-4 font-medium">Víctima</th>
              <th className="py-2 pr-4 font-medium">Provincia</th>
              <th className="py-2 pr-4 font-medium">Cantón</th>
              <th className="py-2 pr-4 font-medium">Distrito</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2 pr-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                  {new Date(row.fecha).toLocaleDateString('es-CR', { timeZone: 'UTC' })}
                </td>
                <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{row.delito}</td>
                <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{row.subDelito}</td>
                <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{row.victima}</td>
                <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{row.provincia}</td>
                <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{row.canton}</td>
                <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{row.distrito}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-zinc-400">
                  Sin resultados para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
