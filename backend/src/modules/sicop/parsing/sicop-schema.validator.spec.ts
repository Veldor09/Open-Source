import { describe, expect, it } from 'vitest';
import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { verifySicopHeader } from './sicop-schema.validator.js';

describe('verifySicopHeader', () => {
  const expected = ['A', 'B', 'C'];

  it('no lanza error si el header coincide exactamente', () => {
    expect(() => verifySicopHeader(['A', 'B', 'C'], expected, 'test.csv')).not.toThrow();
  });

  it('lanza SchemaMismatchError listando columnas faltantes', () => {
    expect(() => verifySicopHeader(['A', 'C'], expected, 'test.csv')).toThrow(SchemaMismatchError);
    try {
      verifySicopHeader(['A', 'C'], expected, 'test.csv');
    } catch (error) {
      expect((error as Error).message).toContain('Faltan: B');
    }
  });

  it('lanza SchemaMismatchError listando columnas sobrantes', () => {
    try {
      verifySicopHeader(['A', 'B', 'C', 'D'], expected, 'test.csv');
      expect.fail('debía lanzar');
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaMismatchError);
      expect((error as Error).message).toContain('Sobran: D');
    }
  });

  it('lanza SchemaMismatchError si el mismo conjunto viene en otro orden', () => {
    try {
      verifySicopHeader(['B', 'A', 'C'], expected, 'test.csv');
      expect.fail('debía lanzar');
    } catch (error) {
      expect(error).toBeInstanceOf(SchemaMismatchError);
      expect((error as Error).message).toContain('distinto orden');
    }
  });
});
