import { describe, expect, it } from 'vitest';
import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { parseInstitucionesRegistradasCsv } from './instituciones-registradas.parser.js';

// Fixture: filas reales de InstitucionesRegistradas.csv (ZIP de agosto 2026).
// La primera fila prueba que una zona geográfica con comas internas
// (correctamente entrecomillada por la fuente) se parsea como un solo campo.
const REAL_FIXTURE = [
  'CEDULA;NOMBRE_INSTITUCION;ZONA_GEO_INST;FECHA_INGRESO;FECHA_MOD',
  '"3002317778";"ASOCIACION ADMINISTRADORA DE ACUEDUCTO Y ALCANTARILLADO SANITARIO DE POZO DE AGUA SAN ANTONIO NICOYA GUANACASTE";"San Antonio, Nicoya, Guanacaste";2026-07-08 00:00:00.0000000;2026-07-13 00:00:00.0000000',
  '"3003092445";"ADE PRO PARQUE INFANTIL Y ORNATO DE LOS LAGOS DEL COYOL DE LA GARITA DE ALAJUELA";"Garita, Alajuela, Alajuela";2020-07-10 00:00:00.0000000;',
].join('\n');

describe('parseInstitucionesRegistradasCsv', () => {
  it('parsea una zona geográfica con comas internas como un solo campo', async () => {
    const rows = await parseInstitucionesRegistradasCsv(REAL_FIXTURE);
    expect(rows[0]).toMatchObject({
      cedula: '3002317778',
      nombre: 'ASOCIACION ADMINISTRADORA DE ACUEDUCTO Y ALCANTARILLADO SANITARIO DE POZO DE AGUA SAN ANTONIO NICOYA GUANACASTE',
      zonaGeografica: 'San Antonio, Nicoya, Guanacaste',
    });
    expect(rows[0].fechaIngreso?.toISOString()).toBe('2026-07-08T00:00:00.000Z');
    expect(rows[0].fechaModificacion?.toISOString()).toBe('2026-07-13T00:00:00.000Z');
  });

  it('devuelve fechaModificacion null cuando el campo viene vacío', async () => {
    const rows = await parseInstitucionesRegistradasCsv(REAL_FIXTURE);
    expect(rows[1].fechaModificacion).toBeNull();
  });

  it('lanza SchemaMismatchError si sobra una columna', async () => {
    const broken = REAL_FIXTURE.replace('CEDULA;', 'CEDULA;EXTRA;');
    await expect(parseInstitucionesRegistradasCsv(broken)).rejects.toThrow(SchemaMismatchError);
  });
});
