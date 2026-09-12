'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OijCrimeCount } from '../oij.types';

interface OijCrimesChartProps {
  data: OijCrimeCount[];
}

export function OijCrimesChart({ data }: OijCrimesChartProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Delitos principales</h3>
      <ResponsiveContainer width="100%" height={Math.max(280, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis
            type="number"
            stroke="var(--chart-axis)"
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--chart-axis)' }}
          />
          <YAxis
            type="category"
            dataKey="delito"
            width={140}
            stroke="var(--chart-axis)"
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => [Number(value).toLocaleString('es-CR'), 'Incidentes']}
            contentStyle={{ borderRadius: 8, borderColor: 'var(--chart-grid)' }}
          />
          <Bar dataKey="total" fill="var(--chart-accent)" radius={[0, 4, 4, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
