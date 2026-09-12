'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TseGeoCount } from '../tse.types';

interface TseGeoChartProps {
  data: TseGeoCount[];
  title: string;
  onSelect?: (nombre: string) => void;
}

export function TseGeoChart({ data, title, onSelect }: TseGeoChartProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</h3>
        {onSelect && <span className="text-xs text-zinc-400">Clic en una barra para ver el detalle</span>}
      </div>
      <ResponsiveContainer width="100%" height={Math.max(280, data.length * 28)}>
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
            dataKey="nombre"
            width={150}
            stroke="var(--chart-axis)"
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => [Number(value).toLocaleString('es-CR'), 'Electores']}
            contentStyle={{ borderRadius: 8, borderColor: 'var(--chart-grid)' }}
          />
          <Bar
            dataKey="cantidadElectores"
            fill="var(--chart-accent)"
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
            style={onSelect ? { cursor: 'pointer' } : undefined}
            onClick={
              onSelect
                ? (entry) => {
                    const nombre = (entry as { nombre?: string })?.nombre;
                    if (nombre) onSelect(nombre);
                  }
                : undefined
            }
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
