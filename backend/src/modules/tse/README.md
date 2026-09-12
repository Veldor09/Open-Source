# Módulo TSE — Información Electoral

Estado: **completo** (Fase 3).

## Institución y fuente oficial

Tribunal Supremo de Elecciones (TSE) —
[www.tse.go.cr/descarga_padron.html](https://www.tse.go.cr/descarga_padron.html).
Archivo real: `https://www.tse.go.cr/zip/padron/padron_completo.zip` (~72 MB
comprimido, publicado mensualmente). Verificado el 11/09/2026: la página
indica "actualizado al 31 de agosto 2026".

## Formato real de la fuente (verificado con LEAME.txt, no asumido)

El ZIP contiene 3 archivos — con nombres reales ligeramente distintos a
como los nombra la propia LEAME.txt en prosa:

| Archivo real (dentro del ZIP) | Tamaño | Contenido |
|---|---|---|
| `PADRON_COMPLETO.txt` | **430 MB** descomprimido | Un registro por elector |
| `distelec.txt` | 178 KB | Catálogo de 2180 distritos electorales |
| `Leame.txt` | 5 KB | Descripción oficial de los campos |

Ambos archivos de datos son **texto separado por comas, codificado en
ISO-8859-1** (no UTF-8), con cada campo además rellenado con espacios a un
ancho fijo (LEAME.txt lo documenta como si fuera de ancho fijo, pero las
comas sí están presentes y son la forma correcta de separar campos).

**PADRON_COMPLETO.txt** — 8 campos por línea:

```
CEDULA, CODELEC, RELLENO, FECHACADUC, JUNTA, NOMBRE, 1.APELLIDO, 2.APELLIDO
```

`CODELEC` (6 dígitos) codifica provincia (1 dígito) + cantón (2) + distrito
(3). **No existe ningún campo de sexo/género ni de edad** en este archivo —
solo `FECHACADUC` (vencimiento de cédula, no fecha de nacimiento) — por lo
que esas dimensiones simplemente no están disponibles para agregar,
verificado contra LEAME.txt.

**distelec.txt** — 4 campos: `CODELEC, PROVINCIA, CANTON, DISTRITO`.
Hallazgo real importante: el primer dígito de `CODELEC` no se limita a
1-7 (las 7 provincias) — el código **8** identifica el **voto en el
extranjero**, con `PROVINCIA="CONSULADO"`, `CANTON=<país>` y
`DISTRITO=<ciudad>` (p. ej. `823001,CONSULADO,MEXICO,CIUDAD DE MEXICO`).
El importador no filtra estos casos: aparecen como una "provincia" más
(`CONSULADO`) en los agregados, honestamente, en vez de descartarlos.

También verificado: un distrito real de Alajuela (código `201060`) tiene
una coma sin escapar en el nombre — `"CAI. JORGE ART. M. C (AMBITOS A,B)"`
— manejado con la misma estrategia de reconstrucción que OIJ.

## Privacidad — por qué este módulo no tiene "buscador de personas"

`PADRON_COMPLETO.txt` contiene cédula y nombre completo real de cada
persona inscrita. **Ningún modelo de este proyecto tiene columnas de
cédula, nombre o apellidos.** El importador (`import-tse.ts`) procesa el
archivo línea por línea con streams (nunca carga los 430 MB en memoria ni
en la base de datos): de cada línea extrae únicamente `CODELEC`,
incrementa un contador en memoria por distrito, y descarta el resto de
inmediato. Ese contador (como máximo ~2180 claves, sin importar cuántos
millones de líneas se procesen) es lo único que se agrega e inserta en
PostgreSQL.

No existe endpoint para consultar por cédula, ni una tabla que permita
reconstruir quién vive en un distrito específico más allá del conteo total.

## Datos almacenados

`TsePadronSnapshot`: una fila por `(fechaSnapshot, provincia, canton,
distrito)` con `cantidadElectores`. `fechaSnapshot` permite acumular
varios cortes mensuales en el tiempo (cada import reemplaza solo el
snapshot de esa fecha, no los anteriores).

## Importación

```bash
npm run import:tse -- --fecha-corte=2026-08-31
npm run import:tse -- --fecha-corte=2026-08-31 --force
```

**La fecha de corte no viene en ningún archivo descargable ni en una API**
— solo aparece como texto renderizado por JavaScript en la página de
descarga (un `fetch` simple del HTML no la trae, verificado). Por eso
`--fecha-corte` es un parámetro explícito: quien importa debe revisar
["actualizado al ..."](https://www.tse.go.cr/descarga_padron.html) y
pasarlo a mano. Si se omite, el importador infiere el último día del mes
anterior y **advierte explícitamente** que debe verificarse.

El importador:
1. Descarga el ZIP (con reintentos ante 5xx/red) y valida la firma `PK`.
2. Calcula un checksum SHA-256; si no cambió desde la última importación,
   se omite (idempotente), salvo `--force`.
3. Abre el ZIP con `yauzl` (streaming), verifica que LEAME.txt siga
   mencionando los campos esperados, carga `distelec.txt` completo en
   memoria (178 KB, catálogo de distritos).
4. Procesa `PADRON_COMPLETO.txt` línea por línea con `readline` sobre un
   stream Latin-1, agregando por distrito sin nunca materializar el
   archivo completo en memoria.
5. Guarda solo los agregados finales (~2180 filas) en una transacción.

Última importación real verificada: 2026-09-11, corte 2026-08-31 —
**3 760 497 electores** en 2178 distritos, 126 cantones, 8 "provincias"
(7 + voto en el extranjero).

## Endpoints propios

- `GET /api/tse/snapshots` — cortes disponibles.
- `GET /api/tse/summary?fecha=` — totales del corte (por defecto, el más reciente).
- `GET /api/tse/by-provincia?fecha=`
- `GET /api/tse/by-canton?fecha=&provincia=`
- `GET /api/tse/by-distrito?fecha=&provincia=&canton=`
- `GET /api/tse/filters` — catálogo de provincias/cantones para poblar selectores.

## Limitaciones conocidas

- Sin sexo, edad ni ninguna otra dimensión demográfica: la fuente no las
  provee para el padrón completo.
- La fecha de corte depende de que un humano la verifique manualmente cada
  mes (ver arriba); un valor incorrecto en `--fecha-corte` no se detecta
  automáticamente.
- Un elector con código electoral fuera del catálogo de `distelec.txt`
  se agruparía bajo "DESCONOCIDO" (no ocurrió en la importación real
  verificada: los 3 760 497 registros coincidieron con un distrito conocido).

## Consideraciones éticas

Esta es la fuente más sensible del observatorio: el archivo fuente
contiene identidad completa (cédula y nombre) de cada persona con derecho
al voto en Costa Rica. El diseño de este módulo prioriza deliberadamente
la privacidad sobre la conveniencia — se sacrificó a propósito la
posibilidad de cualquier funcionalidad de búsqueda o perfil individual
para garantizar que el sistema nunca almacene ni exponga esa información,
transformándola en estadística agregada útil (cuántos electores hay por
distrito) sin comprometer a ninguna persona.
