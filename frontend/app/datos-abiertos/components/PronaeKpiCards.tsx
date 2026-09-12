import type { PronaeSummary } from '../portal-datos.types';

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-CR').format(n);
}

interface PronaeKpiCardsProps {
  summary: PronaeSummary | null;
}

export function PronaeKpiCards({ summary }: PronaeKpiCardsProps) {
  const tiles = [
    { label: 'Personas beneficiarias', value: summary ? formatNumber(summary.totalBeneficiarios) : '—' },
    {
      label: 'Modalidad principal',
      value: summary?.modalidadPrincipal ? summary.modalidadPrincipal.modalidad : '—',
    },
    { label: 'Modalidades activas', value: summary ? String(summary.modalidadesActivas) : '—' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
