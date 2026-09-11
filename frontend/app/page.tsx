import { SourceCard } from "@/components/SourceCard";
import { getSourceStatuses } from "@/services/sources.service";
import type { SourceStatusValue } from "@/types/source";

const AREAS = [
  {
    sourceKey: "oij",
    title: "Seguridad y Justicia",
    description:
      "Estadísticas policiales del Organismo de Investigación Judicial.",
    href: "/oij",
    fallbackInstitution:
      "Organismo de Investigación Judicial (OIJ) / Poder Judicial",
  },
  {
    sourceKey: "portal-pronae",
    title: "Datos Públicos y Sociedad",
    description:
      "Catálogo del Portal Nacional de Datos Abiertos y el programa PRONAE.",
    href: "/datos-abiertos",
    fallbackInstitution: "Portal Nacional de Datos Abiertos / MTSS",
  },
  {
    sourceKey: "tse-padron",
    title: "Información Electoral",
    description: "Agregados estadísticos del padrón electoral.",
    href: "/tse",
    fallbackInstitution: "Tribunal Supremo de Elecciones (TSE)",
  },
  {
    sourceKey: "sicop",
    title: "Contratación Pública",
    description: "Adjudicaciones del Sistema Integrado de Compras Públicas (SICOP).",
    href: "/sicop",
    fallbackInstitution: "Sistema Integrado de Compras Públicas (SICOP) / Ministerio de Hacienda",
  },
] as const;

export default async function Home() {
  const statuses = await getSourceStatuses();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Observatorio Nacional de Datos Públicos de Costa Rica
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Cuatro fuentes oficiales de datos abiertos de Costa Rica, consumidas,
          procesadas y presentadas en un mismo lugar.
        </p>
        {statuses === null && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
            No se pudo conectar con la API en este momento. Mostrando
            información básica de cada fuente.
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {AREAS.map((area) => {
          const live = statuses?.find((s) => s.sourceKey === area.sourceKey);
          const status: SourceStatusValue =
            statuses === null ? "UNAVAILABLE" : (live?.status ?? "UNAVAILABLE");

          return (
            <SourceCard
              key={area.sourceKey}
              title={area.title}
              description={area.description}
              href={area.href}
              institution={live?.institution ?? area.fallbackInstitution}
              status={status}
              retrievedAt={live?.retrievedAt ?? null}
            />
          );
        })}
      </div>
    </div>
  );
}
