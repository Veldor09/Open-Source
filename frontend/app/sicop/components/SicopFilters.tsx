'use client';

import type { SicopFilterOptions, SicopFilterState } from '../sicop.types';

interface SicopFiltersProps {
  options: SicopFilterOptions | null;
  value: SicopFilterState;
  onChange: (next: SicopFilterState) => void;
}

const inputClass =
  'rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950';
const labelClass = 'flex flex-col gap-1 text-sm';
const captionClass = 'text-zinc-600 dark:text-zinc-400';

export function SicopFilters({ options, value, onChange }: SicopFiltersProps) {
  const hasActiveFilters = Boolean(
    value.anio ||
      value.tipoProcedimiento ||
      value.modalidadProcedimiento ||
      value.moneda ||
      value.institucion ||
      value.proveedor ||
      value.fechaInicio ||
      value.fechaFin,
  );

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <label className={labelClass}>
        <span className={captionClass}>Año</span>
        <select
          className={inputClass}
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
        <span className={captionClass}>Tipo de procedimiento</span>
        <select
          className={`${inputClass} max-w-[200px]`}
          value={value.tipoProcedimiento ?? ''}
          onChange={(e) => onChange({ ...value, tipoProcedimiento: e.target.value || undefined })}
        >
          <option value="">Todos</option>
          {options?.tiposProcedimiento.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Modalidad</span>
        <select
          className={`${inputClass} max-w-[180px]`}
          value={value.modalidadProcedimiento ?? ''}
          onChange={(e) => onChange({ ...value, modalidadProcedimiento: e.target.value || undefined })}
        >
          <option value="">Todas</option>
          {options?.modalidades.map((modalidad) => (
            <option key={modalidad} value={modalidad}>
              {modalidad}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Moneda adjudicada</span>
        <select
          className={inputClass}
          value={value.moneda ?? ''}
          onChange={(e) => onChange({ ...value, moneda: e.target.value || undefined })}
        >
          <option value="">Todas</option>
          {options?.monedas.map((moneda) => (
            <option key={moneda} value={moneda}>
              {moneda}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Institución</span>
        <input
          type="text"
          placeholder="Buscar..."
          className={`${inputClass} w-40`}
          value={value.institucion ?? ''}
          onChange={(e) => onChange({ ...value, institucion: e.target.value || undefined })}
        />
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Proveedor</span>
        <input
          type="text"
          placeholder="Buscar..."
          className={`${inputClass} w-40`}
          value={value.proveedor ?? ''}
          onChange={(e) => onChange({ ...value, proveedor: e.target.value || undefined })}
        />
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Adjudicado desde</span>
        <input
          type="date"
          className={inputClass}
          value={value.fechaInicio ?? ''}
          onChange={(e) => onChange({ ...value, fechaInicio: e.target.value || undefined })}
        />
      </label>

      <label className={labelClass}>
        <span className={captionClass}>Adjudicado hasta</span>
        <input
          type="date"
          className={inputClass}
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
