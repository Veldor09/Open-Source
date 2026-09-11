import Link from 'next/link';
import { SicopDashboard } from './components/SicopDashboard';

export default function SicopPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <Link href="/" className="w-fit text-sm text-zinc-500 hover:underline">
          ← Volver al inicio
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Contratación Pública (SICOP)</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Fuente: Sistema Integrado de Compras Públicas (SICOP) ·{' '}
          <a
            href="https://www.sicop.go.cr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            www.sicop.go.cr
          </a>
        </p>
      </div>
      <SicopDashboard />
    </div>
  );
}
