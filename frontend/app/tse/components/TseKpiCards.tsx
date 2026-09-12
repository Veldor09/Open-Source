import type { TseSummary } from '../tse.types';

function formatCompact(n: number): string {
  return new Intl.NumberFormat('es-CR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

function formatFecha(fecha: string): string {
  return new Date(`${fecha}T00:00:00Z`).toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

interface TseKpiCardsProps {
  summary: TseSummary | null;
}

export function TseKpiCards({ summary }: TseKpiCardsProps) {
  const tiles = [
    { label: 'Total de electores', value: summary ? formatCompact(summary.totalElectores) : '—' },
    { label: 'Provincias', value: summary ? String(summary.totalProvincias) : '—' },
    { label: 'Cantones', value: summary ? String(summary.totalCantones) : '—' },
    { label: 'Distritos electorales', value: summary ? String(summary.totalDistritos) : '—' },
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
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Corte del padrón: {formatFecha(summary.fechaSnapshot)}
        </p>
      )}
    </div>
  );
}
