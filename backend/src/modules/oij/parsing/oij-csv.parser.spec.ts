import { describe, expect, it } from 'vitest';
import { parseOijCsvBuffer } from './oij-csv.parser.js';

function buildCsvLine(fields: string[]): string {
  return fields.map((f) => (f.includes(',') ? `"${f}"` : f)).join(',');
}

describe('parseOijCsvBuffer', () => {
  it('decodifica Latin-1 y mapea varias filas reales sin encabezado', async () => {
    const lines = [
      [
        'ASALTO',
        'ARMA BLANCA',
        '2026-01-02',
        'PERSONA',
        'PEATON [PERSONA]',
        'Mayor de edad',
        '',
        'NICARAGUA',
        'CARTAGO',
        'LA UNION',
        'SAN RAMON',
      ],
      [
        'HOMICIDIO',
        'DISCUSION/RIÑA',
        '2023-01-01',
        'PERSONA',
        'PEATON [PERSONA]',
        'Adulto Mayor',
        '',
        'COSTA RICA',
        'SAN JOSÉ',
        'NARANJO',
        'NARANJO',
      ],
    ].map(buildCsvLine);
    const buffer = Buffer.from(lines.join('\n'), 'latin1');

    const result = await parseOijCsvBuffer(buffer);

    expect(result.rowCount).toBe(2);
    expect(result.unexpectedSpacerCount).toBe(0);
    expect(result.rows[1]?.provincia).toBe('SAN JOSÉ');
    expect(result.rows[0]?.anio).toBe(2026);
  });

  it('propaga el error de schema mismatch de una fila mal formada', async () => {
    const buffer = Buffer.from('a,b,c\n', 'latin1');

    await expect(parseOijCsvBuffer(buffer)).rejects.toThrow(/schema mismatch/);
  });

  it('tolera una nacionalidad con coma sin escapar en medio de filas normales (caso real 2015)', async () => {
    const lines = [
      buildCsvLine([
        'ASALTO',
        'ARMA BLANCA',
        '2015-01-01',
        'PERSONA',
        'PEATON [PERSONA]',
        'Mayor de edad',
        '',
        'COSTA RICA',
        'ALAJUELA',
        'POAS',
        'SAN RAFAEL',
      ]),
      // Esta línea trae una coma real sin comillas dentro de Nacionalidad.
      'HURTO,CON LLAVE,2015-04-14,PERSONA,TURISTA/EXTRANJERO [PERSONA],Mayor de edad,,CONGO, REPUBLICA DEMOCRATICA DEL,PUNTARENAS,GARABITO,JACO',
    ];
    const buffer = Buffer.from(lines.join('\n'), 'latin1');

    const result = await parseOijCsvBuffer(buffer);

    expect(result.rowCount).toBe(2);
    expect(result.repairedEmbeddedCommaCount).toBe(1);
    expect(result.rows[1]?.nacionalidad).toBe('CONGO, REPUBLICA DEMOCRATICA DEL');
  });
});
