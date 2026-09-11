import Link from 'next/link';
import { PortalExplorer } from './components/PortalExplorer';
import { PronaeDashboard } from './components/PronaeDashboard';

export default function DatosAbiertosPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/" className="w-fit text-sm text-zinc-500 hover:underline">
          ← Volver al inicio
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Datos Públicos y Sociedad — Portal Nacional
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Fuente: Portal Nacional de Datos Abiertos de Costa Rica ·{' '}
          <a
            href="https://datosabiertos.gob.go.cr/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            portal oficial
          </a>
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Explorador del catálogo</h2>
        <PortalExplorer />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            PRONAE — Personas beneficiarias por modalidad
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ministerio de Trabajo y Seguridad Social (MTSS) ·{' '}
            <a
              href="https://datosabiertos.gob.go.cr/dataset/mtss-personas-beneficiarias-pronae-2021-2024"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              dataset oficial
            </a>
          </p>
        </div>
        <PronaeDashboard />
      </section>
    </div>
  );
}
