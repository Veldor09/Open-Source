import type { SicopSummary } from '../sicop.types';

function formatColonesCompact(n: number): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

function formatCompact(n: number): string {
  return new Intl.NumberFormat('es-CR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CR', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

interface SicopKpiCardsProps {
  summary: SicopSummary | null;
}

export function SicopKpiCards({ summary }: SicopKpiCardsProps) {
  const tiles = [
    {
      label: 'Monto adjudicado (equiv. ₡)',
      value: summary ? formatColonesCompact(summary.montoTotalAdjudicadoCrc) : '—',
    },
    { label: 'Líneas adjudicadas', value: summary ? formatCompact(summary.totalLineas) : '—' },
    { label: 'Instituciones', value: summary ? String(summary.institucionesDistintas) : '—' },
    { label: 'Proveedores', value: summary ? String(summary.proveedoresDistintos) : '—' },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{tile.label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</p>
          </div>
        ))}
      </div>

      {summary && (
        <div className="text-xs text-zinc-400 dark:text-zinc-500">
          <p>
            Adjudicaciones desde {formatFecha(summary.fechaMinima)} hasta {formatFecha(summary.fechaMaxima)}. El
            monto en colones usa el equivalente que la propia SICOP publica por línea (no es una conversión
            calculada por este observatorio).
            {summary.lineasSinEquivalenteCrc > 0 &&
              ` ${summary.lineasSinEquivalenteCrc} línea(s) sin equivalente en colones publicado por SICOP quedan fuera de este total.`}
          </p>
          {summary.porMoneda.length > 1 && (
            <p className="mt-1">
              Por moneda original:{' '}
              {summary.porMoneda
                .map(
                  (m) =>
                    `${m.moneda} ${new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(m.montoOriginal)} (${m.totalLineas} línea${m.totalLineas === 1 ? '' : 's'})`,
                )
                .join(' · ')}
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}
