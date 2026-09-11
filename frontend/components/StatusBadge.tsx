import type { SourceStatusValue } from '@/types/source';

const STYLES: Record<SourceStatusValue, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  STALE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  UNAVAILABLE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  NOT_CONFIGURED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  IMPORTING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  ERROR: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

const LABELS: Record<SourceStatusValue, string> = {
  AVAILABLE: 'Disponible',
  STALE: 'Desactualizado',
  UNAVAILABLE: 'No disponible',
  NOT_CONFIGURED: 'Sin configurar',
  IMPORTING: 'Importando',
  ERROR: 'Error',
};

export function StatusBadge({ status }: { status: SourceStatusValue }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
