import { describe, expect, it } from 'vitest';
import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { parseDistelecContent } from './distelec.parser.js';

// Líneas reales verificadas del recurso (incluida la fila 521, con coma sin escapar).
const REAL_CONTENT = [
  '101001,SAN JOSE,CENTRAL,HOSPITAL                                                ',
  '101002,SAN JOSE,CENTRAL,ZAPOTE                                                  ',
  '201060,ALAJUELA,CENTRAL,CAI. JORGE ART. M. C (AMBITOS A,B)                      ',
  '823001,CONSULADO,MEXICO,CIUDAD DE MEXICO                                        ',
].join('\r\n');

describe('parseDistelecContent', () => {
  it('parsea filas normales y recorta el padding', () => {
    const map = parseDistelecContent(REAL_CONTENT);

    expect(map.get('101001')).toEqual({ provincia: 'SAN JOSE', canton: 'CENTRAL', distrito: 'HOSPITAL' });
  });

  it('reconstruye un distrito con coma sin escapar (caso real: CAI de Alajuela)', () => {
    const map = parseDistelecContent(REAL_CONTENT);

    expect(map.get('201060')).toEqual({
      provincia: 'ALAJUELA',
      canton: 'CENTRAL',
      distrito: 'CAI. JORGE ART. M. C (AMBITOS A,B)',
    });
  });

  it('incluye los códigos de voto en el extranjero (provincia "CONSULADO")', () => {
    const map = parseDistelecContent(REAL_CONTENT);

    expect(map.get('823001')).toEqual({ provincia: 'CONSULADO', canton: 'MEXICO', distrito: 'CIUDAD DE MEXICO' });
  });

  it('lanza SchemaMismatchError si una línea tiene menos columnas de las esperadas', () => {
    expect(() => parseDistelecContent('101001,SAN JOSE,CENTRAL')).toThrow(SchemaMismatchError);
  });

  it('lanza SchemaMismatchError si el archivo no tiene registros', () => {
    expect(() => parseDistelecContent('\r\n\r\n')).toThrow(SchemaMismatchError);
  });
});
