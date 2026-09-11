import { afterEach, describe, expect, it, vi } from 'vitest';
import { ckanPackageShow } from './ckan-client.js';

describe('ckanPackageShow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lanza un error si la respuesta HTTP no es ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' }),
    );

    await expect(ckanPackageShow('https://example.test', 'algun-dataset')).rejects.toThrow(/HTTP 404/);
  });

  it('lanza un error si CKAN responde success=false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: { message: 'Not found' } }),
      }),
    );

    await expect(ckanPackageShow('https://example.test', 'algun-dataset')).rejects.toThrow(/success=false/);
  });

  it('devuelve result cuando la respuesta es exitosa', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, result: { id: 'x', name: 'x', title: 'X', metadata_modified: '', resources: [] } }),
      }),
    );

    const result = await ckanPackageShow('https://example.test', 'x');

    expect(result.id).toBe('x');
  });
});
