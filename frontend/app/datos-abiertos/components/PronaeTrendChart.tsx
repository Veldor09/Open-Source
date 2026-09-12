'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PronaeTrendPoint } from '../portal-datos.types';

interface PronaeTrendChartProps {
  data: PronaeTrendPoint[];
}

export function PronaeTrendChart({ data }: PronaeTrendChartProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Total de beneficiarios por año</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="anio"
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
            width={56}
          />
          <Tooltip
            formatter={(value) => [Number(value).toLocaleString('es-CR'), 'Personas']}
            contentStyle={{ borderRadius: 8, borderColor: 'var(--chart-grid)' }}
          />
          <Bar dataKey="total" fill="var(--chart-accent)" radius={[4, 4, 0, 0]} maxBarSize={64} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
