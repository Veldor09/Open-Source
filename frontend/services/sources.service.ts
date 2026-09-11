import { getApiUrl } from '@/lib/api';
import type { SourceStatus } from '@/types/source';

export async function getSourceStatuses(): Promise<SourceStatus[] | null> {
  try {
    const res = await fetch(`${getApiUrl()}/sources/status`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as SourceStatus[];
  } catch {
    return null;
  }
}
