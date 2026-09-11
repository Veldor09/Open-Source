import { describe, expect, it } from 'vitest';
import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { parseSicopIsoDateTime, parseSicopIsoDateTimeOptional, parseSicopSlashDateOptional } from './sicop-datetime.util.js';

describe('parseSicopIsoDateTime', () => {
  it('parsea una fecha real de DetalleCarteles.csv', () => {
    const fecha = parseSicopIsoDateTime('2026-08-05 11:51:08.0000000', 'FECHA_PUBLICACION');
    expect(fecha.toISOString()).toBe('2026-08-05T11:51:08.000Z');
  });

  it('lanza SchemaMismatchError con un valor corrupto', () => {
    expect(() => parseSicopIsoDateTime('no-es-fecha', 'FECHA_PUBLICACION')).toThrow(SchemaMismatchError);
  });
});

describe('parseSicopIsoDateTimeOptional', () => {
  it('devuelve null si el campo viene vacío', () => {
    expect(parseSicopIsoDateTimeOptional('', 'FECHA_MOD')).toBeNull();
    expect(parseSicopIsoDateTimeOptional('   ', 'FECHA_MOD')).toBeNull();
  });
});

describe('parseSicopSlashDateOptional', () => {
  it('parsea DD/MM/YYYY correctamente (no lo confunde con MM/DD/YYYY)', () => {
    const fecha = parseSicopSlashDateOptional('25/11/2025', 'FECHA_ADJUD_FIRME');
    expect(fecha?.getUTCFullYear()).toBe(2025);
    expect(fecha?.getUTCMonth()).toBe(10);
    expect(fecha?.getUTCDate()).toBe(25);
  });

  it('devuelve null si viene vacío', () => {
    expect(parseSicopSlashDateOptional('', 'FECHA_ADJUD_FIRME')).toBeNull();
  });

  it('lanza SchemaMismatchError si no calza el patrón DD/MM/YYYY', () => {
    expect(() => parseSicopSlashDateOptional('2025-11-25', 'FECHA_ADJUD_FIRME')).toThrow(SchemaMismatchError);
  });
});
