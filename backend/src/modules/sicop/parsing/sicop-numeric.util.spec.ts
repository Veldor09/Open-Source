import { describe, expect, it } from 'vitest';
import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { parseSicopDecimal, parseSicopDecimalOptional } from './sicop-numeric.util.js';

describe('parseSicopDecimal', () => {
  it('parsea un monto real con artefacto de punto flotante propio de la fuente', () => {
    expect(parseSicopDecimal('570.82000000000005', 'MONTO_ADJU_LINEA_CRC')).toBeCloseTo(570.82, 5);
  });

  it('parsea una cantidad entera con decimales ".000"', () => {
    expect(parseSicopDecimal('1.000', 'CANTIDAD')).toBe(1);
  });

  it('parsea un monto real menor a 1 sin el cero inicial (ej. ".085000")', () => {
    expect(parseSicopDecimal('.085000', 'MONTO_ADJU_LINEA')).toBeCloseTo(0.085, 5);
  });

  it('parsea un entero sin parte decimal (ej. LINEA="6")', () => {
    expect(parseSicopDecimal('6', 'LINEA')).toBe(6);
  });

  it('parsea notación científica real de la fuente (ej. "8.99...E-2")', () => {
    expect(parseSicopDecimal('8.9999999999999997E-2', 'MONTO_ADJU_LINEA_USD')).toBeCloseTo(0.09, 4);
  });

  it('lanza SchemaMismatchError en vez de devolver 0 para una cadena vacía', () => {
    expect(() => parseSicopDecimal('', 'MONTO_UNITARIO')).toThrow(SchemaMismatchError);
  });

  it('lanza SchemaMismatchError con texto no numérico', () => {
    expect(() => parseSicopDecimal('n/d', 'MONTO_UNITARIO')).toThrow(SchemaMismatchError);
  });

  it('rechaza números negativos (no se esperan en montos/cantidades de SICOP)', () => {
    expect(() => parseSicopDecimal('-5.00', 'MONTO_UNITARIO')).toThrow(SchemaMismatchError);
  });
});

describe('parseSicopDecimalOptional', () => {
  it('devuelve null para un campo vacío en vez de 0', () => {
    expect(parseSicopDecimalOptional('', 'MONTO_EST')).toBeNull();
  });

  it('parsea normalmente cuando hay valor', () => {
    expect(parseSicopDecimalOptional('12203420.500000', 'MONTO_EST')).toBeCloseTo(12203420.5, 3);
  });
});
