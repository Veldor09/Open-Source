# Módulo SICOP — Contratación Pública

Estado: **completo** (Fase 4, reemplaza al módulo BCCR original — ver nota abajo).

## Institución y fuente oficial

Sistema Integrado de Compras Públicas (SICOP), operado por RACSA bajo la
rectoría del Ministerio de Hacienda: <https://www.sicop.go.cr>.

### Por qué no se consume sicop.go.cr directamente

Al construir este módulo (11/09/2026) se verificó que:

- La URL de datos abiertos indicada originalmente
  (`CE_MOD_DATOSABIERTOSVIEW.jsp`) devuelve `403 Forbidden` (WAF
  Volterra/volt-adc).
- El sitio principal `www.sicop.go.cr` está roto en producción por un bug
  real de CORS: `prod-api.sicop.go.cr` no responde
  `Access-Control-Allow-Origin` a una llamada de arranque (i18n) hecha
  desde `www.sicop.go.cr`, confirmado con la consola del navegador. No es
  un problema de este proyecto.

En su lugar se usa un mecanismo público, documentado y sin autenticación:
el **Observatorio de la Contratación Pública**
(<https://www.observatoriocomprapublica.go.cr/descargas-sicop/>), que
publica mensualmente una réplica de los datos de SICOP en CSV. Esa misma
página documenta el patrón de URL usado por este importador:

```
https://dlsaobservatorioprod.blob.core.windows.net/fs-synapse-observatorio-produccion/Zip/AAAAMM.zip
```

Disponible desde 2010 hasta el mes actual (el mes en curso se actualiza a
diario). No es scraping de HTML: es un patrón de URL documentado
explícitamente por una página oficial-adjacente, sobre un archivo
estructurado (ZIP de CSV), sin evadir ningún control de seguridad.

## Qué se importa (de 24 CSV posibles, 5)

El ZIP mensual trae 24 reportes. Se inspeccionaron 11 de forma real antes
de decidir; se importan estos 5:

| Archivo | Contenido | Grano |
|---|---|---|
| `DetalleCarteles.csv` | Cabecera del procedimiento (estado, fecha de publicación, tipo, modalidad, clasificación bienes/servicios, monto estimado) | 1 fila por `NRO_SICOP` |
| `ProcedimientoAdjudicacion.csv` | Línea adjudicada (institución, proveedor, monto, moneda, fechas) | 1 fila por `NRO_SICOP` + `LINEA` |
| `InstitucionesRegistradas.csv` | Catálogo de instituciones | 1 fila por `CEDULA` |
| `Proveedores.csv` | Catálogo de proveedores | 1 fila por `CEDULA_PROVEEDOR` |
| `Ofertas.csv` | Ofertas presentadas (para el indicador de competencia) | 1 fila por `NRO_OFERTA` — **no es 1 fila por competidor**, ver abajo |

Quedan **fuera de alcance deliberadamente** (documentados aquí por si una
fase futura los necesita, ninguno se descarga ni se procesa):
`AdjudicacionesFirme.csv` (flag de procedimiento desierto),
`SancionProveedores.csv` (proveedores sancionados/inhabilitados — nótese
que este archivo usa **`,` como delimitador**, no `;` como el resto),
`RecursosObjecion.csv`, `Contratos.csv`, `Garantias.csv`,
`FechaPorEtapas.csv` (trazabilidad de trámite interno, útil para medir
plazos), y otros 9 de menor relevancia para un observatorio de gasto
público. `OrdenPedido.csv` (27 MB) e `InvitacionProcedimiento.csv`
(252 MB, el más grande del ZIP) tampoco se tocan.

## Formato real (verificado, no asumido)

- **Codificación UTF-8** en los 4 archivos — a diferencia de OIJ, PRONAE y
  TSE, SICOP **no** usa Latin-1. Verificado con `file`, no asumido.
- **Delimitador `;`** en los 4 archivos importados. Campos entre comillas
  dobles.
- El **header real se valida columna por columna** antes de parsear una
  sola fila (`parsing/sicop-schema.validator.ts`) — si SICOP agrega, quita
  o reordena una columna, la importación de ese período falla con un error
  explícito (`[schema mismatch] ... Faltan: ... Sobran: ...`) en vez de
  importar con un mapeo posicional incorrecto.
- Fechas con hora: `2026-08-05 11:51:08.0000000` (export `datetime2` de SQL
  Server; se trunca a segundos). Una sola columna (`FECHA_ADJUD_FIRME`)
  viene en `DD/MM/YYYY` — verificado con un valor real ("25/11/2025", el
  25 descarta que sea `MM/DD`). `FECHA_SOL_CONTRA` viene en el mismo
  formato ambiguo, pero SICOP publica en paralelo `FECHA_SOL_CONTRA_CL` ya
  normalizada a `YYYY-MM-DD` — se usa esa en vez de reimplementar el
  parseo. Lo mismo con `PROD_ID` (trae un espacio inicial) vs `PROD_ID_CL`
  (limpio): se prefiere la versión `_CL`.
- Montos: además del punto decimal estándar y artefactos de precisión de
  punto flotante propios de la fuente (ej. `570.82000000000005`, no
  introducidos por este proyecto), se encontraron en datos reales dos
  formatos adicionales que el parser acepta explícitamente:
  - Sin cero inicial: `.085000` en vez de `0.085000`.
  - Notación científica para montos muy pequeños: `8.9999999999999997E-2`
    (≈0.09), probablemente `double.ToString()` de .NET en el origen.

  `parsing/sicop-numeric.util.ts` valida el patrón **antes** de convertir
  con `Number()` — `Number('')` vale `0` en JavaScript, no `NaN`, el mismo
  peligro ya encontrado en el parser de PRONAE; una cadena vacía o inválida
  lanza `SchemaMismatchError` en vez de guardar un cero falso.
- `Proveedores.csv` tiene un detalle real poco común: las últimas 3
  columnas del header vienen en minúscula (`zona_geo_prov`,
  `fecha_registro`, `fecha_mod`) mientras el resto está en mayúscula. No es
  un error de este proyecto, así está en la fuente.
- `Ofertas.csv` es puro ASCII (no tiene tildes en sus columnas), pero sigue
  siendo un subconjunto válido de UTF-8 — se lee igual que los demás.
  `TIPO_OFERTA` tiene 3 valores reales verificados: `Individual`,
  `Conjunta` y `Acuerdo Consorcial` (una muestra pequeña inicial solo había
  mostrado `Individual` — no hay que asumir que un campo es constante por
  ver pocas filas). `ID_CONSORCIO` viene poblado en las dos últimas.

## Instituciones y proveedores: foto completa, no incremental

`InstitucionesRegistradas.csv` y `Proveedores.csv` traen el registro
**completo vigente** en cada ZIP mensual (se ven instituciones y
proveedores registrados desde 2010-2016 en el ZIP de agosto 2026) — el
importador reemplaza la tabla completa (`deleteMany` + `createMany`) en
vez de hacer upsert fila por fila.

`DetalleCarteles.csv` y `ProcedimientoAdjudicacion.csv`, en cambio, **no**
están acotados de forma simple al mes del nombre del archivo: se verificó
que el ZIP de agosto 2026 trae líneas adjudicadas con `FECHA_ADJUD_FIRME`
desde enero 2026. Por eso se hace upsert por clave natural (`NRO_SICOP` /
`NRO_SICOP`+`LINEA`) en vez de reemplazar la tabla — así no se pierde
historial sin importar cómo varíe esa ventana entre meses.

**Hallazgo importante para quien use `clasificacionObjeto` (bienes vs.
servicios):** en un solo mes importado, los `NRO_SICOP` de
`ProcedimientoAdjudicacion.csv` (líneas adjudicadas ese rango) y los de
`DetalleCarteles.csv` (procedimientos publicados/modificados ese mes) casi
no se solapan — verificado: 0 coincidencias en agosto 2026 solo. Esto
tiene sentido: un procedimiento adjudicado en agosto normalmente se
**publicó meses antes**. El `JOIN` entre ambas tablas (usado solo para
`categories.porClasificacionObjeto`, ver más abajo) mejora a medida que se
importan más meses hacia atrás con `--desde=`.

`Ofertas.csv`, a diferencia de los dos anteriores, **sí está acotado
estrictamente al mes del ZIP**: verificado que en agosto 2026
`FECHA_PRESENTA_OFERTA` va del 1 al 28 de agosto, sin fechas de otros
meses. Cada fila (`NRO_OFERTA`) es un evento inmutable con llave propia
(0 duplicados verificados en el archivo completo), así que el importador
la inserta con `createMany({ skipDuplicates: true })` en vez de upsert —
no necesita "actualizarse" como sí les pasa a procedimientos/líneas.

## Ofertas.csv y el indicador de competencia: "oferta" ≠ "competidor"

**Hallazgo central, verificado con datos reales de agosto 2026 antes de
diseñar el indicador:** un `NRO_SICOP` puede tener miles de filas en
`Ofertas.csv` con apenas un puñado de proveedores distintos. Caso real:
el procedimiento `20260402513` tiene **1525 filas** pero solo **21**
`CEDULA_PROVEEDOR` distintas — el mismo proveedor reenvía muchas "ofertas"
separadas por minutos (probablemente una fila por línea/ítem ofertado, no
por competidor). Si el indicador de competencia hubiera contado filas, o
incluso `NRO_OFERTA` distintos, habría reportado "1525 competidores" para
ese procedimiento, un número absurdo.

Por eso `getCompetition()` (`sicop.service.ts`) calcula
`COUNT(DISTINCT "cedulaProveedor")` agrupado por `NRO_SICOP` — nunca
`COUNT(*)` ni `COUNT(DISTINCT "nroOferta")`. El endpoint devuelve el
promedio de proveedores por procedimiento, la distribución en baldes
(1 / 2-3 / 4-6 / 7+ proveedores), el `%` de procedimientos con un solo
oferente (indicador clásico de bajo nivel de competencia en compras
públicas) y los 10 procedimientos más competidos.

`GET /api/sicop/competition` usa su propio DTO
(`SicopCompetitionQueryDto`), más chico que el del resto del panel:
`Ofertas.csv` no tiene moneda, tipo de procedimiento ni nombre de
institución, así que solo se filtra por `anio`/rango de fecha (propios de
`FECHA_PRESENTA_OFERTA`) y `proveedor` (join confiable con
`SicopProveedor`, que es una foto completa — no tiene el problema de
cobertura parcial de `SicopProcedimiento`). El frontend le pasa el mismo
estado de filtros compartido del panel; los campos que no aplican aquí
(`institucion`, `tipoProcedimiento`, `modalidadProcedimiento`, `moneda`)
simplemente se descartan (`ValidationPipe` con `whitelist: true`), no
producen error.

## Privacidad

`ProcedimientoAdjudicacion.csv` trae `CEDULA_REPRESENTANTE` y
`REPRESENTANTE` (cédula y nombre del representante legal del proveedor,
una persona física). **Deliberadamente no se persisten** — mismo criterio
ya aplicado a OIJ (no se identifica víctimas/imputados) y TSE (no se
guarda cédula/nombre del padrón): este observatorio no guarda identidad de
personas cuando no es necesaria para su propósito de transparencia de
gasto público.

## Manejo de moneda (regla explícita del proyecto: no inventar conversiones)

`MONEDA_PRECIO_EST` (moneda del precio estimado) y `MONEDA_ADJUDICADA`
(moneda en la que realmente se adjudicó) **pueden diferir en la misma
línea** — verificado con datos reales (precio estimado en CRC, adjudicado
en USD). El par autoritativo de cada línea es `MONEDA_ADJUDICADA` +
`MONTO_ADJU_LINEA`.

SICOP publica además `MONTO_ADJU_LINEA_CRC` y `MONTO_ADJU_LINEA_USD`: el
equivalente de esa línea ya convertido por la propia fuente. Este proyecto
**nunca calcula una conversión propia** — solo usa el equivalente en
colones que SICOP ya publica, y lo rotula explícitamente como tal en el
frontend ("equivalente publicado por SICOP", nunca "monto real" a secas).
El endpoint `/summary` también expone `porMoneda`, el desglose sin ningún
tipo de cambio (cada moneda con su propio monto original), y
`lineasSinEquivalenteCrc` (líneas que no tienen equivalente en colones
publicado, excluidas del total en colones — nunca se les asume `0`).

## Esquema cambiante: SCHEMA_MISMATCH

Si el header real de cualquiera de los 4 CSV no coincide exactamente con
el esperado (`sicop.constants.ts`), o si el ZIP no trae alguno de los 4
archivos esperados, la importación de ese período se detiene por completo
y `DataSourceStatus` queda en `ERROR` con un mensaje
`[schema mismatch] ...` que lista qué columnas faltan, sobran, o si el
mismo conjunto de columnas llegó en otro orden. Nunca se importa con un
mapeo adivinado.

## Datos almacenados

- `SicopProcedimiento` — cabecera del procedimiento (`DetalleCarteles.csv`).
- `SicopLineaAdjudicada` — línea adjudicada (`ProcedimientoAdjudicacion.csv`).
  Incluye `tipoProcedimiento`/`modalidadProcedimiento` duplicados desde la
  propia fuente (ya vienen repetidos en este archivo) para poder agregar
  sin unir tablas.
- `SicopInstitucion` / `SicopProveedor` — catálogos.
- `SicopOferta` — una oferta presentada (`Ofertas.csv`). Ver limitación de
  interpretación arriba antes de usar esta tabla directamente.
- `SicopImport` — checksum e idempotencia por período (`AAAAMM`), mismo
  patrón que `OijImport`.
- `DataSourceStatus` (modelo compartido, `sourceKey = "sicop"`).

No hay relaciones de Prisma declaradas entre estos modelos (igual que
OIJ/PRONAE/TSE) — el cruce entre `SicopLineaAdjudicada` y
`SicopProcedimiento` para `clasificacionObjeto` se hace con `$queryRaw`
(`JOIN` explícito por `NRO_SICOP`), no con una relación declarada.

## Importación

```bash
npm run import:sicop                          # mes actual
npm run import:sicop -- --periodo=202608      # un mes específico
npm run import:sicop -- --desde=202601        # ese mes hasta el actual
npm run import:sicop -- --periodo=202608 --force  # reimporta aunque no haya cambiado
```

Idempotente por período (checksum SHA-256 del ZIP completo). Instituciones
y proveedores se reemplazan por completo en cada corrida (son una foto
vigente); procedimientos y líneas se actualizan por upsert; ofertas se
insertan una sola vez (evento inmutable, `createMany` + `skipDuplicates`).

Verificado en vivo el 11/09/2026: agosto 2026 → 2274 procedimientos, 1649
líneas adjudicadas, 679 instituciones, 57 937 proveedores, 26 060 ofertas,
sin errores. Backfill enero-septiembre 2026 (9 períodos) también
verificado sin errores.

## Endpoints propios

Todos (excepto `/filters`) aceptan como filtros por query param: `anio`,
`fechaInicio`/`fechaFin` (sobre `FECHA_ADJUD_FIRME`), `institucion`
(subcadena), `proveedor` (subcadena), `tipoProcedimiento`,
`modalidadProcedimiento`, `moneda`. La agregación ocurre en PostgreSQL,
nunca en el frontend.

- `GET /api/sicop/summary` — monto total adjudicado (equiv. ₡), líneas,
  instituciones/proveedores distintos, rango de fechas, desglose por
  moneda original.
- `GET /api/sicop/trends` — monto adjudicado por mes (`date_trunc` en SQL).
- `GET /api/sicop/institutions` — top 15 instituciones por monto.
- `GET /api/sicop/suppliers` — top 15 proveedores por monto, enriquecido
  con tamaño/tipo de proveedor.
- `GET /api/sicop/categories` — distribución por tipo de procedimiento,
  modalidad, y clasificación bienes/servicios (este último, join real
  con `SicopProcedimiento` — ver limitación de cobertura arriba).
- `GET /api/sicop/filters` — valores distintos para los selectores del frontend.
- `GET /api/sicop/records?page=&pageSize=` — líneas adjudicadas paginadas
  (máx. 100 por página).
- `GET /api/sicop/competition` — indicador de competencia (ver sección
  dedicada arriba). Filtros propios: `anio`, `fechaInicio`, `fechaFin`,
  `proveedor` (no los del resto del panel).

## Limitaciones conocidas

- `categories.porClasificacionObjeto` solo cubre procedimientos cuya
  cabecera (`DetalleCarteles.csv`) ya se importó — con pocos meses de
  historia acumulada, la cobertura será parcial. Mejora al backfillear
  con `--desde=`.
- `competition` no distingue el tipo de oferta (`Individual` / `Conjunta` /
  `Acuerdo Consorcial`) ni usa `ID_CONSORCIO` — cuenta proveedores
  distintos sin importar si ofertaron solos o en consorcio. Tampoco se
  filtra por institución/tipo de procedimiento (requeriría el mismo join
  de cobertura parcial que `categories`).
- No se importan `AdjudicacionesFirme.csv`, `SancionProveedores.csv`,
  `RecursosObjecion.csv`, `Contratos.csv` ni `Garantias.csv` — quedan como
  posible fase 2 (ver tabla arriba).
- La réplica del Observatorio de Contratación Pública puede ir hasta 24
  horas detrás del sistema SICOP principal, y algunos reportes de
  proveedores pueden excluir registros muy recientes — mostrado
  explícitamente en el frontend.
- No se calcula ningún indicador de riesgo, irregularidad o
  favoritismo — solo cifras agregadas de lo que la fuente publica.

## Reemplaza al módulo BCCR

Este módulo reemplaza por completo la integración original de Fase 4
(tipo de cambio del Banco Central), que quedó bloqueada por una migración
de infraestructura del propio BCCR (ver historial del proyecto). OIJ,
Portal Nacional y TSE no se modificaron.
