# Observatorio Nacional de Datos Públicos de Costa Rica

Proyecto universitario de 4 integrantes. Cada integrante es responsable de integrar
**una fuente de datos abiertos oficial de Costa Rica** de principio a fin (consumo real,
procesamiento/normalización, persistencia cuando aplica, API propia y visualización),
dentro de una sola aplicación que las presenta como un observatorio unificado.

> Estado actual: **Fases 0, 1 (OIJ), 2 (Portal Nacional / PRONAE), 3 (TSE) y
> 4 (SICOP) completadas**. La Fase 4 originalmente integraba el tipo de
> cambio del BCCR, pero el Web Service oficial quedó bloqueado por una
> migración de infraestructura del propio banco (ver historial en
> [`backend/src/modules/sicop/README.md`](backend/src/modules/sicop/README.md))
> y se reemplazó por contratación pública (SICOP), verificado en vivo con
> datos reales.

## 1. Problema

La información pública de Costa Rica (seguridad, datos abiertos generales, padrón
electoral, indicadores económicos) está dispersa en portales y formatos distintos
(CKAN, ZIP, Web Services XML, XLSX/CSV), cada uno con su propia forma de consulta.
No existe un punto único que la normalice y la presente de forma comparable.

## 2. Objetivo

Construir un observatorio web que consuma, procese y visualice datos reales de 4
fuentes oficiales, cada una tratada como un dominio independiente (no se fuerzan
correlaciones artificiales entre fuentes que miden fenómenos distintos):

| Área | Fuente | Institución |
|---|---|---|
| Seguridad y Justicia | Estadísticas Policiales | Organismo de Investigación Judicial (OIJ) / Poder Judicial |
| Datos Públicos y Sociedad | Catálogo CKAN + dataset PRONAE | Portal Nacional de Datos Abiertos / MTSS |
| Información Electoral | Padrón Electoral (agregado) | Tribunal Supremo de Elecciones (TSE) |
| Contratación Pública | Adjudicaciones (SICOP) | Sistema Integrado de Compras Públicas / Ministerio de Hacienda |

## 3. Arquitectura

```
Open Source/
├── backend/     API NestJS + Prisma (PostgreSQL)
├── frontend/    Next.js (App Router)
├── docker-compose.yml   PostgreSQL local
└── .env.example
```

- **Backend** expone una API propia (`/api/...`) organizada en módulos por fuente
  (`oij`, `portal-datos`, `tse`, `sicop`) más un módulo compartido `sources` que
  guarda únicamente la **procedencia** de cada fuente (URL oficial, recurso
  consultado, fecha de obtención, estado). Cada fuente usa sus propios modelos de
  datos — no hay una tabla genérica de "datos".
- **Frontend** consume exclusivamente la API propia (nunca llama directamente a
  las instituciones desde el navegador). El dashboard principal muestra las 4
  áreas con su estado real; cada área tiene su propio dashboard.
- Las integraciones que requieren archivos grandes, ZIP, XML o formatos antiguos
  se procesan en el backend mediante procesos de importación (`npm run import:*`),
  no en cada request del usuario.

Cada fuente documenta su propio mecanismo de consumo, transformación y
limitaciones en el README de su módulo dentro de `backend/src/modules/<fuente>`.

## 4. Tecnologías

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + Recharts
- **Backend:** NestJS + TypeScript + Prisma ORM
- **Base de datos:** PostgreSQL 16
- **Infraestructura local:** Docker Compose (solo PostgreSQL)

## 5. Requisitos

- Node.js 20+ y npm
- Docker y Docker Compose
- Git

## 6. Instalación

```bash
git clone <url-del-repo>
cd "Open Source"
cp .env.example .env
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

Ajusta los valores copiados a cada `.env` si es necesario (por defecto funcionan
para desarrollo local).

## 7. Base de datos (Docker + PostgreSQL)

```bash
docker compose up -d
```

Esto levanta un PostgreSQL en `localhost:5432` con las credenciales definidas en
`.env` (usuario/clave/base de datos por defecto: `observatorio`/`observatorio`/`observatorio_cr`).

## 8. Backend

```bash
cd backend
npm install              # ejecuta "postinstall": prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

> **Nota:** en Prisma 7, `prisma migrate dev` aplica la migración pero **no**
> regenera el cliente automáticamente. `npm install` sí lo hace (script
> `postinstall`), pero si cambias `schema.prisma` a mano sin reinstalar,
> corre `npx prisma generate` explícitamente o verás errores como
> `Cannot read properties of undefined` al usar un modelo nuevo.
>
> También fija `prisma`/`@prisma/client` en `7.10.0`: al momento de escribir
> esto, el tag `latest` del paquete `prisma` apunta a un release candidate
> (`8.0.0-rc.13`) con una dependencia interna rota. No actualices a `latest`
> sin verificar antes que sea una versión estable.

La API queda disponible en `http://localhost:3001/api`.

- `GET /api/health` — chequeo de salud del servicio.
- `GET /api/sources/status` — procedencia y estado de las 4 fuentes.

`npm run prisma:seed` solo registra las 4 fuentes en `NOT_CONFIGURED` (es
metadata de procedencia, no datos). Para ver datos reales en cada fuente
hay que correr su importador — ver la sección 10.

## 9. Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## 10. Importadores por fuente

| Fuente | Comando | Estado |
|---|---|---|
| OIJ | `npm run import:oij -- --year=<AAAA>` o `-- --all` | **Fase 1 completa** |
| Portal Nacional / PRONAE | `npm run import:pronae` | **Fase 2 completa** |
| TSE | `npm run import:tse -- --fecha-corte=AAAA-MM-DD` | **Fase 3 completa** |
| SICOP | `npm run import:sicop -- [--periodo=AAAAMM \| --desde=AAAAMM]` | **Fase 4 completa** |

Los cuatro importadores son idempotentes (comparan el checksum del recurso
antes de reimportar; usar `--force` para forzar) y reintentan descargas
ante errores 5xx/red (`common/http/fetch-with-retry.ts`). El de TSE
procesa un archivo de ~430 MB descomprimidos por streaming, sin cargarlo
nunca completo en memoria, y requiere `--fecha-corte` porque el TSE no
publica esa fecha en ningún archivo ni API (ver su README). El de SICOP
descarga un ZIP mensual (`--periodo`, por defecto el mes actual, o
`--desde` para traer varios meses de una vez) y necesita algunos meses de
historia acumulada para que su indicador de bienes/servicios tenga buena
cobertura (ver su README). Detalle completo en el README de cada módulo:
[OIJ](backend/src/modules/oij/README.md) ·
[Portal Nacional](backend/src/modules/portal-datos/README.md) ·
[TSE](backend/src/modules/tse/README.md) ·
[SICOP](backend/src/modules/sicop/README.md).

## 11. Responsables por fuente

| Fuente | Integrante |
|---|---|
| OIJ | Gerald Álvarez |
| Portal Nacional de Datos Abiertos | Emmanuel Porras |
| TSE | Joseth Venegas |
| SICOP | Diego Araya |

## 12. Endpoints propios

Ver el detalle de cada módulo en `backend/src/modules/<fuente>/README.md` a
medida que se implementan.

Comunes (Fase 0):

- `GET /api/health`
- `GET /api/sources/status`

OIJ (Fase 1) — todos aceptan `anio`, `fechaInicio`, `fechaFin`, `delito`,
`provincia` y `canton` como filtros por query param:

- `GET /api/oij/summary`
- `GET /api/oij/trends`
- `GET /api/oij/crimes`
- `GET /api/oij/locations?nivel=provincia|canton|distrito`
- `GET /api/oij/filters`
- `GET /api/oij/records?page=&pageSize=`

Portal Nacional (Fase 2):

- `GET /api/portal-datos/datasets?q=` — explorador en vivo del catálogo
  CKAN completo (13 datasets, cualquier institución).
- `GET /api/portal-datos/datasets/:id` — detalle de un dataset.
- `GET /api/portal-datos/pronae/years`
- `GET /api/portal-datos/pronae/summary?anio=`
- `GET /api/portal-datos/pronae/by-modality?anio=`
- `GET /api/portal-datos/pronae/trend`
- `GET /api/portal-datos/pronae/table`

TSE (Fase 3):

- `GET /api/tse/snapshots` — cortes mensuales disponibles.
- `GET /api/tse/summary?fecha=`
- `GET /api/tse/by-provincia?fecha=`
- `GET /api/tse/by-canton?fecha=&provincia=`
- `GET /api/tse/by-distrito?fecha=&provincia=&canton=`
- `GET /api/tse/filters`

SICOP (Fase 4) — `summary`/`trends`/`institutions`/`suppliers`/`categories`/
`records` aceptan `anio`, `fechaInicio`, `fechaFin`, `institucion`,
`proveedor`, `tipoProcedimiento`, `modalidadProcedimiento` y `moneda` como
filtros por query param:

- `GET /api/sicop/summary` — monto adjudicado (equivalente en colones,
  publicado por la propia SICOP, nunca convertido por este proyecto),
  líneas/instituciones/proveedores distintos, desglose por moneda original.
- `GET /api/sicop/trends` — monto adjudicado por mes.
- `GET /api/sicop/institutions` / `GET /api/sicop/suppliers` — top 15 por monto.
- `GET /api/sicop/categories` — por tipo de procedimiento, modalidad y
  clasificación bienes/servicios.
- `GET /api/sicop/filters`
- `GET /api/sicop/records?page=&pageSize=` — líneas adjudicadas paginadas.
- `GET /api/sicop/competition` — proveedores distintos que compitieron por
  procedimiento (nunca cuenta filas de oferta ni ofertas por separado —
  ver README del módulo).

## 13. Limitaciones conocidas

- El módulo `sources` solo guarda metadata de procedencia, no reintenta
  automáticamente fuentes caídas más allá de lo que cada módulo defina.
- Las fuentes con archivos grandes (TSE) se procesan por lotes y no en tiempo real.
- OIJ: los nombres de provincia/cantón/distrito se muestran tal cual los
  reporta la fuente (sin normalizar contra un catálogo territorial), y el
  dataset no permite conclusiones sobre reincidencia o perfiles individuales.
  Detalle en [`backend/src/modules/oij/README.md`](backend/src/modules/oij/README.md).
- Portal Nacional: el explorador de catálogo consulta CKAN en vivo (sin
  caché); PRONAE son datos ya agregados por el MTSS, solo 2021-2024. Detalle
  en [`backend/src/modules/portal-datos/README.md`](backend/src/modules/portal-datos/README.md).
- TSE: sin dimensión de sexo ni edad (la fuente no las provee); la fecha de
  corte del padrón se pasa a mano (`--fecha-corte`) porque el TSE no la
  publica en ningún archivo ni API. Detalle en
  [`backend/src/modules/tse/README.md`](backend/src/modules/tse/README.md).
- SICOP: solo se importan 4 de los 24 reportes disponibles (procedimientos,
  líneas adjudicadas, instituciones, proveedores); el indicador de
  bienes/servicios depende de tener varios meses de historia importada
  (ver su README). La réplica del Observatorio de Contratación Pública
  puede ir hasta 24 horas detrás del sistema SICOP principal. Detalle en
  [`backend/src/modules/sicop/README.md`](backend/src/modules/sicop/README.md).

## 14. Privacidad

- El padrón del TSE nunca se persiste a nivel de persona: el archivo fuente
  trae cédula y nombre completo de cada elector, pero el importador los
  descarta línea por línea durante el streaming y solo guarda conteos
  agregados por distrito (`TsePadronSnapshot`). Ningún modelo de este
  proyecto tiene columnas de cédula, nombre o apellidos. Ver
  [`backend/src/modules/tse/README.md`](backend/src/modules/tse/README.md).
- SICOP publica `CEDULA_REPRESENTANTE` y `REPRESENTANTE` (representante
  legal del proveedor, una persona física) en su reporte de adjudicaciones;
  este proyecto **no los persiste**, mismo criterio que con el padrón del
  TSE. Ver [`backend/src/modules/sicop/README.md`](backend/src/modules/sicop/README.md).

## 15. Manejo de errores

Cada fuente externa reporta uno de estos estados en `/api/sources/status`:
`AVAILABLE`, `STALE`, `UNAVAILABLE`, `NOT_CONFIGURED`, `IMPORTING`, `ERROR`.
Una fuente caída no debe afectar la disponibilidad de las demás ni de la
aplicación en general.
