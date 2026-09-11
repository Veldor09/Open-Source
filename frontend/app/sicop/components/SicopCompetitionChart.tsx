'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SicopCompetitionBucket } from '../sicop.types';

interface SicopCompetitionChartProps {
  data: SicopCompetitionBucket[];
}

const BUCKET_LABELS: Record<string, string> = {
  '1': '1 proveedor',
  '2-3': '2-3 proveedores',
  '4-6': '4-6 proveedores',
  '7+': '7 o más',
};

export function SicopCompetitionChart({ data }: SicopCompetitionChartProps) {
  const chartData = data.map((d) => ({ ...d, etiqueta: BUCKET_LABELS[d.proveedores] ?? d.proveedores }));

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Procedimientos según cantidad de proveedores que compitieron
      </h3>
      {chartData.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-400">Sin datos para los filtros seleccionados.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="etiqueta"
              stroke="var(--chart-axis)"
              tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-axis)' }}
            />
            <YAxis
              stroke="var(--chart-axis)"
              tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={48}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value) => [Number(value).toLocaleString('es-CR'), 'Procedimientos']}
              contentStyle={{ borderRadius: 8, borderColor: 'var(--chart-grid)' }}
            />
            <Bar dataKey="procedimientos" fill="var(--chart-accent)" radius={[4, 4, 0, 0]} maxBarSize={64} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
