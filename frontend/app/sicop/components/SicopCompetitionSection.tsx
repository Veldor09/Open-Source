import type { SicopCompetition } from '../sicop.types';
import { SicopCompetitionChart } from './SicopCompetitionChart';

interface SicopCompetitionSectionProps {
  data: SicopCompetition | null;
}

function formatPercent(n: number): string {
  return `${n.toLocaleString('es-CR', { maximumFractionDigits: 1 })}%`;
}

export function SicopCompetitionSection({ data }: SicopCompetitionSectionProps) {
  const tiles = [
    {
      label: 'Procedimientos con ofertas registradas',
      value: data ? data.totalProcedimientos.toLocaleString('es-CR') : '—',
    },
    {
      label: 'Proveedores por procedimiento (promedio)',
      value: data ? data.promedioProveedoresPorProcedimiento.toLocaleString('es-CR', { maximumFractionDigits: 1 }) : '—',
    },
    {
      label: 'Procedimientos con un solo oferente',
      value: data ? `${data.procedimientosUnProveedor.toLocaleString('es-CR')} (${formatPercent(data.porcentajeUnProveedor)})` : '—',
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Competencia por procedimiento</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Cuenta proveedores <strong>distintos</strong> que ofertaron por procedimiento (a partir de{' '}
          <code>Ofertas.csv</code>), no la cantidad de registros de oferta — un mismo proveedor puede presentar
          varias ofertas (una por línea) para el mismo procedimiento.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</p>
          </div>
        ))}
      </div>

      <SicopCompetitionChart data={data?.distribucion ?? []} />

      {data && data.masCompetidos.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Procedimientos más competidos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="py-2 pr-4 font-medium">N.º SICOP</th>
                  <th className="py-2 pr-4 font-medium">Proveedores distintos</th>
                  <th className="py-2 pr-4 font-medium">Ofertas registradas</th>
                </tr>
              </thead>
              <tbody>
                {data.masCompetidos.map((row) => (
                  <tr key={row.nroSicop} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-2 pr-4 tabular-nums text-zinc-700 dark:text-zinc-300">{row.nroSicop}</td>
                    <td className="py-2 pr-4 tabular-nums text-zinc-700 dark:text-zinc-300">
                      {row.proveedoresDistintos}
                    </td>
                    <td className="py-2 pr-4 tabular-nums text-zinc-700 dark:text-zinc-300">{row.totalOfertas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
