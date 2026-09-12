'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OijLocationCount, OijLocationLevel } from '../oij.types';

interface OijLocationsChartProps {
  data: OijLocationCount[];
  nivel: OijLocationLevel;
  onNivelChange: (nivel: OijLocationLevel) => void;
}

const NIVEL_LABELS: Record<OijLocationLevel, string> = {
  provincia: 'Provincia',
  canton: 'Cantón',
  distrito: 'Distrito',
};

export function OijLocationsChart({ data, nivel, onNivelChange }: OijLocationsChartProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Distribución territorial</h3>
        <div className="flex gap-1">
          {(Object.keys(NIVEL_LABELS) as OijLocationLevel[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onNivelChange(key)}
              className={`rounded-md px-2 py-1 text-xs ${
                nivel === key
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              {NIVEL_LABELS[key]}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="nombre"
            stroke="var(--chart-axis)"
            tick={{ fill: 'var(--chart-muted)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--chart-axis)' }}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            stroke="var(--chart-axis)"
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            formatter={(value) => [Number(value).toLocaleString('es-CR'), 'Incidentes']}
            contentStyle={{ borderRadius: 8, borderColor: 'var(--chart-grid)' }}
          />
          <Bar dataKey="total" fill="var(--chart-accent)" radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
