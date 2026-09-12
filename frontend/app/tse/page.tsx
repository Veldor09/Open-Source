import Link from 'next/link';
import { TseDashboard } from './components/TseDashboard';

export default function TsePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/" className="w-fit text-sm text-zinc-500 hover:underline">
          ← Volver al inicio
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Información Electoral — Padrón Nacional
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Fuente: Tribunal Supremo de Elecciones (TSE) ·{' '}
          <a
            href="https://www.tse.go.cr/descarga_padron.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            página oficial
          </a>
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Solo se muestran agregados por distrito electoral. No se procesan ni almacenan cédulas ni nombres de
          personas.
        </p>
      </div>
      <TseDashboard />
    </div>
  );
}
