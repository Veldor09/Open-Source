import { describe, expect, it } from 'vitest';
import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { mapOijCsvRecord } from './oij-csv-row.mapper.js';

// Fila real observada en el recurso CKAN 2026 (columna 7 vacía verificada).
const REAL_ROW = [
  'ASALTO',
  'ARMA BLANCA',
  '2026-01-01',
  'VIVIENDA',
  'NO APLICA [VIVIENDA]',
  'Mayor de edad                                     ',
  '',
  'COSTA RICA',
  'PUNTARENAS',
  'CORREDORES',
  'CANOAS',
];

describe('mapOijCsvRecord', () => {
  it('mapea una fila real a los 10 campos verificados, recortando espacios', () => {
    const { row, unexpectedSpacerValue } = mapOijCsvRecord(REAL_ROW, 1);

    expect(row).toEqual({
      delito: 'ASALTO',
      subDelito: 'ARMA BLANCA',
      fecha: new Date('2026-01-01T00:00:00Z'),
      anio: 2026,
      victima: 'VIVIENDA',
      subVictima: 'NO APLICA [VIVIENDA]',
      edad: 'Mayor de edad',
      nacionalidad: 'COSTA RICA',
      provincia: 'PUNTARENAS',
      canton: 'CORREDORES',
      distrito: 'CANOAS',
    });
    expect(unexpectedSpacerValue).toBe(false);
  });

  it('marca unexpectedSpacerValue cuando la columna vacía conocida trae datos', () => {
    const fields = [...REAL_ROW];
    fields[6] = 'ALGO INESPERADO';

    const { unexpectedSpacerValue } = mapOijCsvRecord(fields, 2);

    expect(unexpectedSpacerValue).toBe(true);
  });

  it('lanza SchemaMismatchError si el número de columnas cambia', () => {
    const fields = REAL_ROW.slice(0, 9);

    expect(() => mapOijCsvRecord(fields, 3)).toThrow(SchemaMismatchError);
  });

  it('lanza SchemaMismatchError si la fecha es inválida', () => {
    const fields = [...REAL_ROW];
    fields[2] = 'no-es-una-fecha';

    expect(() => mapOijCsvRecord(fields, 4)).toThrow(SchemaMismatchError);
  });

  it('reconstruye Nacionalidad cuando trae una coma sin escapar (fila real de 2015)', () => {
    // HURTO,CON LLAVE,2015-04-14,PERSONA,TURISTA/EXTRANJERO [PERSONA],Mayor de edad,,CONGO, REPUBLICA DEMOCRATICA DEL,PUNTARENAS,GARABITO,JACO
    const fields = [
      'HURTO',
      'CON LLAVE',
      '2015-04-14',
      'PERSONA',
      'TURISTA/EXTRANJERO [PERSONA]',
      'Mayor de edad                                     ',
      '',
      'CONGO',
      ' REPUBLICA DEMOCRATICA DEL',
      'PUNTARENAS',
      'GARABITO',
      'JACO',
    ];

    const { row, repairedEmbeddedComma } = mapOijCsvRecord(fields, 14925);

    expect(repairedEmbeddedComma).toBe(true);
    expect(row.nacionalidad).toBe('CONGO, REPUBLICA DEMOCRATICA DEL');
    expect(row.provincia).toBe('PUNTARENAS');
    expect(row.canton).toBe('GARABITO');
    expect(row.distrito).toBe('JACO');
  });

  it('reconstruye Nacionalidad incluso con varias comas sin escapar', () => {
    const fields = [...REAL_ROW];
    fields[7] = 'A';
    fields.splice(8, 0, 'B', 'C'); // "A, B, C" partido en tres columnas

    const { row, repairedEmbeddedComma } = mapOijCsvRecord(fields, 6);

    expect(repairedEmbeddedComma).toBe(true);
    expect(row.nacionalidad).toBe('A,B,C');
    expect(row.provincia).toBe('PUNTARENAS');
  });
});
