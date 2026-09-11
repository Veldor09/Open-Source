import type { PronaeTable as PronaeTableData } from '../portal-datos.types';

interface PronaeTableProps {
  data: PronaeTableData | null;
}

export function PronaeTable({ data }: PronaeTableProps) {
  if (!data) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Tabla completa (Cuadro 1.4, fuente original)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <th className="py-2 pr-4 font-medium">Modalidad</th>
              {data.anios.map((anio) => (
                <th key={anio} className="py-2 pr-4 text-right font-medium tabular-nums">
                  {anio}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.tabla.map((row) => (
              <tr key={row.modalidad} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2 pr-4 text-zinc-700 dark:text-zinc-300">{row.modalidad}</td>
                {data.anios.map((anio) => (
                  <td key={anio} className="py-2 pr-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    {(row.valores[anio] ?? 0).toLocaleString('es-CR')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
