export interface FetchWithRetryOptions {
  retries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/**
 * fetch() con reintentos acotados para llamadas a fuentes externas: errores
 * 5xx/red se reintentan (con backoff lineal), errores 4xx no (no tiene
 * sentido reintentar un 404). Usado por los importadores batch de las 4
 * fuentes (OIJ, PRONAE, TSE, SICOP); acepta method/headers/body por si una
 * fuente futura necesita POST en vez de GET.
 */
export async function fetchWithRetry(
  url: string,
  { retries = 2, retryDelayMs = 1000, timeoutMs = 60_000, method, headers, body }: FetchWithRetryOptions = {},
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok || response.status < 500) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
