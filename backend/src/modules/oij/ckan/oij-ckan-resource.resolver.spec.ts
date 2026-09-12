import { afterEach, describe, expect, it, vi } from 'vitest';
import { findOijCsvResourceForYear } from './oij-ckan-resource.resolver.js';

function mockPackageShowResponse(resources: { name: string; format: string }[]) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      success: true,
      result: {
        id: 'estadisticas-policiales',
        name: 'estadisticas-policiales',
        title: 'Estadísticas Policiales',
        metadata_modified: '2026-08-03T13:15:11.122318',
        resources: resources.map((r, i) => ({
          id: `res-${i}`,
          name: r.name,
          format: r.format,
          url: `https://example.test/${r.name}`,
          created: '2026-01-01T00:00:00',
          last_modified: '2026-01-01T00:00:00',
        })),
      },
    }),
  };
}

describe('findOijCsvResourceForYear', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('encuentra el recurso CSV que coincide con el año', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockPackageShowResponse([
          { name: 'Estadísticas Policiales 2025 - CSV', format: 'CSV' },
          { name: 'Estadísticas Policiales 2026 - CSV', format: 'CSV' },
          { name: 'Estadísticas Policiales 2026 - XML', format: 'XML' },
        ]),
      ),
    );

    const resource = await findOijCsvResourceForYear(2026);

    expect(resource.format).toBe('CSV');
    expect(resource.name).toContain('2026');
  });

  it('lanza un error descriptivo si no hay CSV para ese año', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockPackageShowResponse([{ name: 'Estadísticas Policiales 2025 - CSV', format: 'CSV' }]),
      ),
    );

    await expect(findOijCsvResourceForYear(1999)).rejects.toThrow(/No se encontró un recurso CSV/);
  });
});
