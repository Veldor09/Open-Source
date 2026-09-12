'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { OijTrendPoint } from '../oij.types';

function formatMonth(iso: string): string {
  // date_trunc('month', ...) llega como medianoche UTC del día 1; forzar
  // timeZone: 'UTC' evita que caiga en el mes anterior en Costa Rica (UTC-6).
  return new Date(iso).toLocaleDateString('es-CR', { year: '2-digit', month: 'short', timeZone: 'UTC' });
}

interface OijTrendChartProps {
  data: OijTrendPoint[];
}

export function OijTrendChart({ data }: OijTrendChartProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">Incidentes por mes</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="mes"
            tickFormatter={formatMonth}
            stroke="var(--chart-axis)"
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--chart-axis)' }}
            minTickGap={24}
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
            labelFormatter={(label) => formatMonth(String(label))}
            contentStyle={{ borderRadius: 8, borderColor: 'var(--chart-grid)' }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--chart-accent)"
            strokeWidth={2}
            fill="var(--chart-accent)"
            fillOpacity={0.1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
