# Módulo Portal Nacional — Datos Públicos y Sociedad

Estado: **completo** (Fase 2). Tiene dos capacidades independientes: un
explorador en vivo del catálogo CKAN y el procesamiento real de un dataset
(PRONAE).

## Institución y fuente oficial

Portal Nacional de Datos Abiertos de Costa Rica ([datosabiertos.gob.go.cr](https://datosabiertos.gob.go.cr/)),
instalación CKAN. Al 11/09/2026 el catálogo completo tiene **13 datasets**
de 3 instituciones (Ministerio de Hacienda, MTSS, MEIC), el 100% en
formato XLSX.

Dataset procesado: [Personas beneficiarias del PRONAE, según modalidad de
proyecto, 2021-2024](https://datosabiertos.gob.go.cr/dataset/mtss-personas-beneficiarias-pronae-2021-2024)
(slug `mtss-personas-beneficiarias-pronae-2021-2024`), Ministerio de
Trabajo y Seguridad Social (MTSS).

## A) Explorador del catálogo (en vivo, sin persistencia)

`explorer/portal-explorer.service.ts` usa `package_search` y `package_show`
de la Action API de CKAN (compartido con OIJ en `common/ckan/`) para
buscar y mostrar el detalle de **cualquier** dataset del portal —
institución, grupos, licencia, etiquetas, fecha de actualización y sus
recursos. No se guarda nada en la base de datos: con solo 13 datasets en
todo el portal, consultar CKAN en cada request es razonable y siempre
refleja el catálogo real.

Antes de asumir que un recurso puede consultarse como tabla (CKAN
DataStore), se comprobó con `resource_show` sobre el recurso de PRONAE: la
respuesta no trae el campo `datastore_active` en absoluto, confirmando que
DataStore no está habilitado en este portal — por eso se procesa el XLSX
directamente en el backend en vez de intentar `datastore_search`.

## B) Procesamiento real: PRONAE

### Formato real de la fuente (verificado, no asumido)

El recurso (9 KB) tiene **una sola hoja** ("C 1.4", nombre que coincide con
el archivo `cuadro-1.4-...xlsx`) con **5 columnas** (`Modalidad`, `2021`,
`2022`, `2023`, `2024`) y **8 filas** (1 encabezado + 7 datos, una de ellas
"Total"). No es una tabla de microdatos por persona — es un cuadro
resumen ya agregado por el MTSS.

Particularidades confirmadas al inspeccionar el archivo real:

- Los valores llegan como **texto**, con **espacio normal** como separador
  de miles (`" 25 952"`, no espacio irrompible), y `"-"` representa cero.
- La fila **"Total" es una suma real** de las demás modalidades (verificado:
  25 952 = suma de las 6 modalidades en 2021) — se usa solo como
  verificación cruzada al importar; **no se persiste** como una modalidad
  más, para no arriesgar que se desincronice del detalle.
- Existen 6 modalidades reales: Apoyo a capacitación, Apoyo a indígenas,
  Búsqueda Activa de Empleo (BAE), EMPLÉATE, Ideas productivas, Obra
  comunal.

### Proceso de transformación

`parsing/pronae-xlsx.parser.ts` valida que la primera columna sea
"Modalidad" y que las demás sean años, separa la fila "Total" para la
verificación cruzada, y solo acepta `"-"` o dígitos con espacios como
valor — cualquier otra cosa (texto, celda corrupta) falla con un error de
"schema mismatch" en vez de convertirse silenciosamente en cero
(`Number('')` es `0` en JavaScript, así que esta validación explícita de
formato es necesaria).

### Datos almacenados

- `PronaeBeneficiario`: una fila por `(modalidad, año)`, con `cantidad`.
  Restricción única en `(modalidad, año)` — a diferencia de OIJ, aquí sí
  existe una llave natural, así que la importación es un `upsert` directo
  en vez de "borrar y volver a insertar por año".
- `DataSourceStatus` (`sourceKey = "portal-pronae"`): procedencia visible
  en el dashboard principal.

## Importación

```bash
npm run import:pronae            # importa/actualiza
npm run import:pronae -- --force # reimporta aunque no haya cambiado
```

Idempotente por checksum del archivo (igual que OIJ). La descarga usa
`fetchWithRetry` (`common/http/`) porque el dominio de descarga real
(`datos.go.cr`, distinto del dominio del portal) devolvió un `522` de
Cloudflare transitorio durante el desarrollo — se resolvió solo al
reintentar.

## Endpoints propios

Explorador:

- `GET /api/portal-datos/datasets?q=` — busca en el catálogo completo.
- `GET /api/portal-datos/datasets/:id` — detalle de un dataset (cualquiera
  del portal, no solo PRONAE).

PRONAE:

- `GET /api/portal-datos/pronae/years` — años disponibles.
- `GET /api/portal-datos/pronae/summary?anio=` — total, modalidad
  principal y modalidades activas de un año (por defecto, el más reciente).
- `GET /api/portal-datos/pronae/by-modality?anio=` — desglose por
  modalidad de un año.
- `GET /api/portal-datos/pronae/trend` — total por año (2021-2024).
- `GET /api/portal-datos/pronae/table` — la tabla completa modalidad × año,
  tal como la publica la fuente.

## Limitaciones conocidas

- El dataset son datos ya agregados por el MTSS — no hay forma de bajar a
  nivel de persona ni de verificar la metodología de conteo más allá de lo
  que el propio cuadro documenta.
- Solo 4 años de historia (2021-2024); no permite comparar contra períodos
  anteriores.
- El explorador de catálogo depende de que CKAN esté disponible en cada
  request (no tiene caché); si el portal cae, esa sección se degrada pero
  PRONAE (ya importado) sigue funcionando.

## Consideraciones éticas

PRONAE ya es un agregado estadístico público (personas por modalidad y
año) publicado oficialmente por el MTSS; no contiene ni permite inferir
identidad individual. El explorador de catálogo solo expone metadata
pública de los datasets (título, institución, licencia), nunca contenido
de recursos que no se haya procesado explícitamente.
