import { describe, expect, it } from 'vitest';
import { SchemaMismatchError } from '../../../common/errors/schema-mismatch.error.js';
import { parsePronaeSheet } from './pronae-xlsx.parser.js';

// Contenido real de la hoja "C 1.4" del recurso CKAN (verificado 2026-09-11).
const REAL_SHEET: string[][] = [
  ['Modalidad', '2021', '2022', '2023', '2024'],
  ['Total', ' 25 952', ' 16 406', ' 20 196', ' 18 764'],
  ['Apoyo a capacitación', ' 2 262', ' 2 954', '  707', '-'],
  ['Apoyo a indígenas', ' 1 997', ' 3 694', ' 3 978', ' 2 603'],
  ['Búsqueda Activa de Empleo (BAE)', '-', '-', '  53', '  347'],
  ['EMPLÉATE', ' 19 188', ' 7 098', ' 13 547', ' 13 660'],
  ['Ideas productivas', '  570', '  417', '  5', '-'],
  ['Obra comunal', ' 1 935', ' 2 243', ' 1 906', ' 2 154'],
];

describe('parsePronaeSheet', () => {
  it('parsea la hoja real, excluye la fila Total y recorta espacios de miles', () => {
    const { rows, totalMismatches } = parsePronaeSheet(REAL_SHEET);

    expect(rows).not.toContainEqual(expect.objectContaining({ modalidad: 'Total' }));
    expect(rows).toContainEqual({ modalidad: 'EMPLÉATE', anio: 2021, cantidad: 19188 });
    expect(rows).toContainEqual({ modalidad: 'Apoyo a capacitación', anio: 2024, cantidad: 0 }); // "-"
    expect(rows).toContainEqual({ modalidad: 'Búsqueda Activa de Empleo (BAE)', anio: 2023, cantidad: 53 });
    expect(totalMismatches).toEqual([]); // la fuente cuadra: 25952 = suma de modalidades 2021
  });

  it('detecta cuando la fila Total no cuadra con la suma de modalidades', () => {
    const tampered = REAL_SHEET.map((r) => [...r]);
    tampered[1]![1] = ' 999999'; // Total 2021 alterado

    const { totalMismatches } = parsePronaeSheet(tampered);

    expect(totalMismatches).toEqual([{ anio: 2021, declarado: 999999, calculado: 25952 }]);
  });

  it('lanza SchemaMismatchError si la primera columna no es "Modalidad"', () => {
    const bad = [['Categoria', '2021'], ['X', '1']];
    expect(() => parsePronaeSheet(bad)).toThrow(SchemaMismatchError);
  });

  it('lanza SchemaMismatchError si un encabezado de año no es numérico', () => {
    const bad = [['Modalidad', 'no-es-un-año'], ['X', '1']];
    expect(() => parsePronaeSheet(bad)).toThrow(SchemaMismatchError);
  });

  it('lanza SchemaMismatchError si un valor no es numérico ni "-"', () => {
    const bad = [['Modalidad', '2021'], ['X', 'n/d']];
    expect(() => parsePronaeSheet(bad)).toThrow(SchemaMismatchError);
  });

  it('lanza SchemaMismatchError si la hoja está vacía', () => {
    expect(() => parsePronaeSheet([])).toThrow(SchemaMismatchError);
  });
});
