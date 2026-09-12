import type { OijSummary } from '../oij.types';

function formatCompact(n: number): string {
  return new Intl.NumberFormat('es-CR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  // Las fechas llegan como medianoche UTC; forzar timeZone: 'UTC' evita que
  // se corran un día hacia atrás en zonas horarias negativas (Costa Rica).
  return new Date(iso).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

interface OijKpiCardsProps {
  summary: OijSummary | null;
}

export function OijKpiCards({ summary }: OijKpiCardsProps) {
  const tiles = [
    { label: 'Total de incidentes', value: summary ? formatCompact(summary.totalRegistros) : '—' },
    { label: 'Tipos de delito distintos', value: summary ? String(summary.delitosDistintos) : '—' },
    { label: 'Provincias con registros', value: summary ? String(summary.provinciasDistintas) : '—' },
    {
      label: 'Rango de fechas',
      value: summary ? `${formatDate(summary.fechaMinima)} – ${formatDate(summary.fechaMaxima)}` : '—',
    },
  ];

  return (
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
  );
}
