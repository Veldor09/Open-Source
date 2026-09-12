import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { DISTELEC_FIELD_COUNT } from '../tse.constants.js';

export interface DistelecEntry {
  provincia: string;
  canton: string;
  distrito: string;
}

/**
 * Parsea DISTELEC.txt completo (178 KB, cabe en memoria sin problema) a un
 * mapa CODELEC -> {provincia, canton, distrito}. Un distrito real
 * ("CAI. JORGE ART. M. C (AMBITOS A,B)", verificado en la fuente) trae una
 * coma sin escapar — igual que en OIJ, se reconstruye uniendo el resto de
 * la línea en el último campo (DISTRITO).
 */
export function parseDistelecContent(content: string): Map<string, DistelecEntry> {
  const map = new Map<string, DistelecEntry>();
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  lines.forEach((line, index) => {
    const fields = line.split(',');
    const working = fields.length > DISTELEC_FIELD_COUNT ? reconstructDistrito(fields) : fields;

    if (working.length !== DISTELEC_FIELD_COUNT) {
      throw new SchemaMismatchError(
        `DISTELEC.txt línea ${index + 1}: se esperaban ${DISTELEC_FIELD_COUNT} columnas, se encontraron ${fields.length}.`,
      );
    }

    const [codelec, provincia, canton, distrito] = working;
    map.set(codelec!.trim(), {
      provincia: provincia!.trim(),
      canton: canton!.trim(),
      distrito: distrito!.trim(),
    });
  });

  if (map.size === 0) {
    throw new SchemaMismatchError('DISTELEC.txt no tiene registros.');
  }

  return map;
}

function reconstructDistrito(fields: string[]): string[] {
  const prefix = fields.slice(0, DISTELEC_FIELD_COUNT - 1);
  const distrito = fields.slice(DISTELEC_FIELD_COUNT - 1).join(',');
  return [...prefix, distrito];
}
