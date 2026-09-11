'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface SicopBarDatum {
  nombre: string;
  montoCrc: number;
}

interface SicopBarChartProps {
  title: string;
  data: SicopBarDatum[];
}

function formatColones(n: number): string {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);
}

// Nombres de instituciones/proveedores (razón social completa) pueden pasar
// de 60 caracteres y se encimaban entre barras — se truncan solo en el eje;
// el tooltip sigue mostrando el nombre completo (viene del dato, no del eje).
function truncateLabel(value: string): string {
  return value.length > 26 ? `${value.slice(0, 26)}…` : value;
}

/** Barra horizontal genérica para montos por institución/proveedor/categoría — reusada en 4 lugares del dashboard. */
export function SicopBarChart({ title, data }: SicopBarChartProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</h3>
      {data.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-400">Sin datos para los filtros seleccionados.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, data.length * 32)}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
            <XAxis
              type="number"
              stroke="var(--chart-axis)"
              tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-axis)' }}
              tickFormatter={(value) =>
                new Intl.NumberFormat('es-CR', { notation: 'compact', maximumFractionDigits: 1 }).format(
                  Number(value),
                )
              }
            />
            <YAxis
              type="category"
              dataKey="nombre"
              width={180}
              stroke="var(--chart-axis)"
              tick={{ fill: 'var(--chart-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={truncateLabel}
            />
            <Tooltip
              formatter={(value) => [formatColones(Number(value)), 'Monto (equiv. ₡)']}
              labelFormatter={(label) => String(label)}
              contentStyle={{ borderRadius: 8, borderColor: 'var(--chart-grid)' }}
            />
            <Bar dataKey="montoCrc" fill="var(--chart-accent)" radius={[0, 4, 4, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
