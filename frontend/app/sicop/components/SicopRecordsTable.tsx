'use client';

import type { SicopLineaAdjudicadaRecord } from '../sicop.types';

interface SicopRecordsTableProps {
  rows: SicopLineaAdjudicadaRecord[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CR', { timeZone: 'UTC' });
}

function formatMonto(valor: number, moneda: string): string {
  try {
    return new Intl.NumberFormat('es-CR', { style: 'currency', currency: moneda, maximumFractionDigits: 2 }).format(
      valor,
    );
  } catch {
    // Por si SICOP publica un código de moneda que Intl no reconoce (poco probable, pero no debe romper la tabla).
    return `${moneda} ${valor.toLocaleString('es-CR')}`;
  }
}

export function SicopRecordsTable({ rows, total, page, totalPages, onPageChange }: SicopRecordsTableProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Líneas adjudicadas ({total.toLocaleString('es-CR')})
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
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="py-2 pr-4 font-medium">Adjudicación firme</th>
              <th className="py-2 pr-4 font-medium">Institución</th>
              <th className="py-2 pr-4 font-medium">Proveedor</th>
              <th className="py-2 pr-4 font-medium">Bien / servicio</th>
              <th className="py-2 pr-4 font-medium">Monto (moneda original)</th>
              <th className="py-2 pr-4 font-medium">Equiv. ₡</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2 pr-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                  {formatFecha(row.fechaAdjudicacionFirme)}
                </td>
                <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300" title={row.institucion}>
                  {row.institucion.length > 40 ? `${row.institucion.slice(0, 40)}…` : row.institucion}
                </td>
                <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300" title={row.nombreProveedor}>
                  {row.nombreProveedor.length > 32 ? `${row.nombreProveedor.slice(0, 32)}…` : row.nombreProveedor}
                </td>
                <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300" title={row.descripcionBienServicio}>
                  {row.descripcionBienServicio.length > 48
                    ? `${row.descripcionBienServicio.slice(0, 48)}…`
                    : row.descripcionBienServicio}
                </td>
                <td className="py-2 pr-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                  {formatMonto(row.montoLineaAdjudicada, row.monedaAdjudicada)}
                </td>
                <td className="py-2 pr-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                  {row.montoLineaAdjudicadaCrc !== null ? formatMonto(row.montoLineaAdjudicadaCrc, 'CRC') : '—'}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-zinc-400">
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
