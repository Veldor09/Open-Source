'use client';

import type { OijFilterOptions, OijFilterState } from '../oij.types';

interface OijFiltersProps {
  options: OijFilterOptions | null;
  value: OijFilterState;
  onChange: (next: OijFilterState) => void;
}

const selectClass =
  'rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950';
const labelClass = 'flex flex-col gap-1 text-sm';
const captionClass = 'text-zinc-600 dark:text-zinc-400';

export function OijFilters({ options, value, onChange }: OijFiltersProps) {
  const hasActiveFilters = Boolean(
    value.anio || value.delito || value.provincia || value.canton || value.fechaInicio || value.fechaFin,
  );

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <label className={labelClass}>
        <span className={captionClass}>Año</span>
        <select
          className={selectClass}
          value={value.anio ?? ''}
          onChange={(e) => onChange({ ...value, anio: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">Todos</option>
          {options?.anios.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Delito</span>
        <select
          className={`${selectClass} max-w-[220px]`}
          value={value.delito ?? ''}
          onChange={(e) => onChange({ ...value, delito: e.target.value || undefined })}
        >
          <option value="">Todos</option>
          {options?.delitos.map((delito) => (
            <option key={delito} value={delito}>
              {delito}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Provincia</span>
        <select
          className={selectClass}
          value={value.provincia ?? ''}
          onChange={(e) => onChange({ ...value, provincia: e.target.value || undefined })}
        >
          <option value="">Todas</option>
          {options?.provincias.map((provincia) => (
            <option key={provincia} value={provincia}>
              {provincia}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Cantón</span>
        <select
          className={selectClass}
          value={value.canton ?? ''}
          onChange={(e) => onChange({ ...value, canton: e.target.value || undefined })}
        >
          <option value="">Todos</option>
          {options?.cantones.map((canton) => (
            <option key={canton} value={canton}>
              {canton}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Desde</span>
        <input
          type="date"
          className={selectClass}
          value={value.fechaInicio ?? ''}
          onChange={(e) => onChange({ ...value, fechaInicio: e.target.value || undefined })}
        />
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Hasta</span>
        <input
          type="date"
          className={selectClass}
          value={value.fechaFin ?? ''}
          onChange={(e) => onChange({ ...value, fechaFin: e.target.value || undefined })}
        />
      </label>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
