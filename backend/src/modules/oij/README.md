# Módulo OIJ — Seguridad y Justicia

Estado: **completo** (Fase 1).

## Institución y fuente oficial

Organismo de Investigación Judicial (OIJ) / Poder Judicial de Costa Rica.
Dataset: [Estadísticas Policiales](https://datosabiertospj.poder-judicial.go.cr/dataset/estadisticas-policiales)
(portal CKAN), slug `estadisticas-policiales`.

## Mecanismo de consumo

1. Se consulta `package_show` de la Action API de CKAN
   (`https://datosabiertospj.poder-judicial.go.cr/api/3/action/package_show?id=estadisticas-policiales`)
   para descubrir los recursos disponibles — **la URL del CSV nunca se
   hardcodea**, siempre se descubre por año y formato (`common/ckan/`).
2. El backend descarga el recurso CSV del año pedido directamente (no hay
   llamada desde el navegador).
3. Se calcula un hash SHA-256 del archivo descargado para detectar si ya se
   importó exactamente ese contenido (idempotencia).

## Formato real de la fuente (verificado, no asumido)

El CSV **no tiene fila de encabezado** y llega codificado en **ISO-8859-1**
(Latin-1), no UTF-8. El orden real de columnas se confirmó cruzando el CSV
con el XSD que trae el recurso XML del mismo dataset (generado por SQL
Server), y se validó contra muestras reales de 2015, 2016, 2017, 2018, 2020,
2023 y 2026:

```
Delito, SubDelito, Fecha, Victima, SubVictima, Edad, (columna vacía), Nacionalidad, Provincia, Canton, Distrito
```

Diferencias importantes respecto a lo que se asumía originalmente:

- **No existe un campo `Hora`** — `Fecha` es de tipo fecha, sin componente de hora.
- **No existe ningún campo de sexo/género** en la fuente actual.
- **`Edad` es una categoría**, no un número: `Menor de edad`, `Mayor de
  edad`, `Adulto Mayor`, `Desconocido` (vienen con relleno de espacios que
  se recorta al normalizar).
- Hay una **columna extra, siempre vacía**, entre `Edad` y `Nacionalidad`
  que no existe en el esquema XML — se descarta explícitamente
  (`OIJ_CSV_COLUMN_COUNT` en `oij.constants.ts`).
- **`Nacionalidad` puede traer comas sin escapar** (p. ej. "CONGO,
  REPUBLICA DEMOCRATICA DEL"), lo que generaba filas con 12 columnas en
  lugar de 11 en varios años (2015, 2016, 2017, 2021-2025 lo tuvieron). El
  importador reconstruye el campo uniendo el tramo entre la columna vacía y
  los tres campos geográficos finales — ver
  `parsing/oij-csv-row.mapper.ts`.

Si el número de columnas cambia de forma que no se pueda reconstruir (menos
de las esperadas), el importador falla con un error de "schema mismatch" en
lugar de importar datos incorrectos silenciosamente.

## Proceso de transformación

`parsing/oij-csv.parser.ts` decodifica el buffer como Latin-1 y parsea con
`csv-parse` (streaming) con `relax_column_count_more` habilitado para tolerar
las comas sin escapar. Cada fila pasa por `mapOijCsvRecord`
(`parsing/oij-csv-row.mapper.ts`), que recorta espacios, reconstruye
`Nacionalidad` cuando corresponde y valida la fecha.

## Datos almacenados

- `OijIncidente`: un registro por incidente, con los 10 campos verificados
  más `anio` (derivado de `Fecha`, para filtrar sin recalcular). Índices en
  `fecha`, `anio`, `delito`, `provincia`, `canton`.
- `OijImport`: metadata de importación por año (`resourceId`, `resourceUrl`,
  `checksum`, `rowCount`, `importedAt`) — permite reimportar de forma segura
  sin duplicar datos.
- `DataSourceStatus` (modelo compartido, `sourceKey = "oij"`): procedencia
  visible en el dashboard principal del observatorio.

## Importación

```bash
npm run import:oij -- --year=2026        # un año específico
npm run import:oij -- --all              # 2015 hasta el año actual
npm run import:oij -- --year=2026 --force # reimporta aunque no haya cambiado
```

Es **idempotente**: si el checksum del recurso no cambió desde la última
importación, se omite. Al reimportar un año, sus registros anteriores se
reemplazan dentro de una transacción (no se acumulan duplicados). Si un año
falla, el importador continúa con los demás y termina con código de salida
distinto de cero.

Última importación completa verificada: 11/09/2026 (2015–2026, ~574 000
registros).

## Endpoints propios

Todos aceptan filtros por query params (`anio`, `fechaInicio`, `fechaFin`,
`delito`, `provincia`, `canton`) y agregan en PostgreSQL, nunca en el
frontend:

- `GET /api/oij/summary` — total de registros, delitos/provincias
  distintos, rango de fechas.
- `GET /api/oij/trends` — incidentes por mes (`date_trunc` en SQL).
- `GET /api/oij/crimes` — top 15 delitos.
- `GET /api/oij/locations?nivel=provincia|canton|distrito` — distribución
  territorial.
- `GET /api/oij/filters` — valores distintos para poblar los selectores del
  frontend.
- `GET /api/oij/records?page=&pageSize=` — tabla paginada (máx. 100 por
  página).

## Limitaciones conocidas

- Los nombres de provincia/cantón/distrito vienen tal cual los reporta el
  OIJ (mayúsculas, sin acentos consistentes); no se normalizan contra un
  catálogo territorial oficial.
- El dataset agrega por incidente reportado, no por víctima ni por persona
  imputada — no permite conclusiones sobre reincidencia o perfiles.
- El frontend no afirma relaciones causales (p. ej. "la provincia X tiene
  más delitos porque..."); solo muestra las cifras agregadas.

## Consideraciones éticas

Los datos son estadísticas agregadas por categoría (delito, ubicación,
rango etario, nacionalidad), sin identificar personas. No se muestra ni se
almacena información que permita identificar víctimas o personas
imputadas. La categoría `Nacionalidad` se conserva porque así la publica la
fuente oficial, pero el dashboard evita cualquier narrativa que vincule
nacionalidad con criminalidad; solo se expone como una dimensión de filtro
más, igual que provincia o tipo de delito.
