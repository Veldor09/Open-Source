import { describe, expect, it } from 'vitest';
import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { extractCodelecFromPadronLine } from './padron-line.mapper.js';

// Línea real observada en la muestra del recurso (nombre/apellidos truncados
// aquí para no repetir PII real en el repositorio; la forma es idéntica).
const REAL_LINE =
  '101053316,104015, ,20280207,00000,LUCILA                        ,PORRAS                    ,AGUERO                 ';

describe('extractCodelecFromPadronLine', () => {
  it('extrae únicamente el CODELEC de una línea real', () => {
    expect(extractCodelecFromPadronLine(REAL_LINE, 1)).toBe('104015');
  });

  it('acepta códigos de voto en el extranjero (primer dígito 8)', () => {
    const line = REAL_LINE.replace('104015', '823001');
    expect(extractCodelecFromPadronLine(line, 2)).toBe('823001');
  });

  it('lanza SchemaMismatchError si el número de columnas cambia', () => {
    const bad = REAL_LINE.split(',').slice(0, 6).join(',');
    expect(() => extractCodelecFromPadronLine(bad, 3)).toThrow(SchemaMismatchError);
  });

  it('lanza SchemaMismatchError si CODELEC no son 6 dígitos', () => {
    const bad = REAL_LINE.replace('104015', 'ABCDEF');
    expect(() => extractCodelecFromPadronLine(bad, 4)).toThrow(SchemaMismatchError);
  });
});
