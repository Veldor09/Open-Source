import { describe, expect, it } from 'vitest';
import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { verifyLeameSchema } from './leame-schema.validator.js';

const REAL_LEAME_EXCERPT = `
| CAMPO      | LARGO | DE    A | SIGNIFICADO                          |
| CEDULA     |   9   |  1    9 | # cedula del ciudadano               |
| CODELEC    |   6   | 10   15 | Codigo Electoral donde esta inscrito |
DISTELEC.TXT el cual contiene los nombres de todos los distritos
|CODELE    |   6   | 1   6 | Seis digitos del codigo electoral        |
|PROVINCIA |  10   | 7  16 | Nombre de la provincia                   |
|CANTON    |  20   |17  36 | Nombre del canton electoral              |
|DISTRITO  |  34   |37  70 | Nombre del distrito electoral            |
`;

describe('verifyLeameSchema', () => {
  it('no lanza con el texto real de LEAME.txt', () => {
    expect(() => verifyLeameSchema(REAL_LEAME_EXCERPT)).not.toThrow();
  });

  it('lanza SchemaMismatchError si falta un campo esperado', () => {
    const withoutCodelec = REAL_LEAME_EXCERPT.replace(/CODELEC/g, 'XXXXXXX');
    expect(() => verifyLeameSchema(withoutCodelec)).toThrow(SchemaMismatchError);
  });

  it('lanza SchemaMismatchError con un texto completamente distinto', () => {
    expect(() => verifyLeameSchema('Este archivo ya no describe nada de esto.')).toThrow(SchemaMismatchError);
  });
});
