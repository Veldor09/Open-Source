import Link from 'next/link';
import type { SourceStatusValue } from '@/types/source';
import { StatusBadge } from './StatusBadge';

interface SourceCardProps {
  title: string;
  description: string;
  href: string;
  institution: string;
  status: SourceStatusValue;
  retrievedAt?: string | null;
}

export function SourceCard({
  title,
  description,
  href,
  institution,
  status,
  retrievedAt,
}: SourceCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
        <StatusBadge status={status} />
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">{institution}</p>
      {retrievedAt && (
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          Última actualización: {new Date(retrievedAt).toLocaleString('es-CR')}
        </p>
      )}
    </Link>
  );
}
