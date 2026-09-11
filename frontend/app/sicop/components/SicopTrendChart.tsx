'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { SicopTrendPoint } from '../sicop.types';

function formatMonth(iso: string): string {
  // date_trunc('month', ...) llega como medianoche UTC del día 1; forzar
  // timeZone: 'UTC' evita que caiga en el mes anterior en Costa Rica (UTC-6).
  return new Date(iso).toLocaleDateString('es-CR', { year: '2-digit', month: 'short', timeZone: 'UTC' });
}

function formatColones(n: number): string {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);
}

interface SicopTrendChartProps {
  data: SicopTrendPoint[];
}

export function SicopTrendChart({ data }: SicopTrendChartProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Monto adjudicado por mes (equivalente en colones)
      </h3>
      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-400">Sin datos para los filtros seleccionados.</p>
      ) : (
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
              width={64}
              tickFormatter={(value) =>
                new Intl.NumberFormat('es-CR', { notation: 'compact', maximumFractionDigits: 1 }).format(
                  Number(value),
                )
              }
            />
            <Tooltip
              formatter={(value) => [formatColones(Number(value)), 'Monto adjudicado']}
              labelFormatter={(label) => formatMonth(String(label))}
              contentStyle={{ borderRadius: 8, borderColor: 'var(--chart-grid)' }}
            />
            <Area
              type="monotone"
              dataKey="montoCrc"
              stroke="var(--chart-accent)"
              strokeWidth={2}
              fill="var(--chart-accent)"
              fillOpacity={0.1}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
