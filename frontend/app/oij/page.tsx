import Link from 'next/link';
import { OijDashboard } from './components/OijDashboard';

export default function OijPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/" className="w-fit text-sm text-zinc-500 hover:underline">
          ← Volver al inicio
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Seguridad y Justicia — Estadísticas Policiales
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Fuente: Organismo de Investigación Judicial (OIJ) / Poder Judicial de Costa Rica ·{' '}
          <a
            href="https://datosabiertospj.poder-judicial.go.cr/dataset/estadisticas-policiales"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            recurso oficial
          </a>
        </p>
      </div>
      <OijDashboard />
    </div>
  );
}
