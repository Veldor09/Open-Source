import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';

/**
 * LEAME.txt es texto libre, no un esquema máquina-legible, así que no se
 * puede "parsear" en sentido estricto. Esta validación es deliberadamente
 * ligera: confirma que los nombres de campo que el importador asume
 * (CODELEC para ubicar al elector, DISTELEC para resolver provincia/cantón/
 * distrito) siguen apareciendo en el texto oficial. Si el TSE reescribe
 * LEAME.txt con otra terminología, esto debe fallar en vez de importar en
 * silencio con una interpretación potencialmente equivocada.
 */
const REQUIRED_TOKENS = ['CEDULA', 'CODELEC', 'DISTELEC', 'PROVINCIA', 'CANTON', 'DISTRITO'];

export function verifyLeameSchema(leameText: string): void {
  const upper = leameText.toUpperCase();
  const missing = REQUIRED_TOKENS.filter((token) => !upper.includes(token));

  if (missing.length > 0) {
    throw new SchemaMismatchError(
      `LEAME.txt ya no menciona los campos esperados (${missing.join(', ')}). ` +
        'El formato del padrón pudo haber cambiado; revisar LEAME.txt manualmente antes de continuar.',
    );
  }
}
