import { httpsEndpoint } from './https-endpoint';

type RequestResource = (url: string, init: RequestInit) => Promise<Pick<Response, 'status' | 'ok' | 'json'>>;

export type PrivateReadError = 'unauthorized' | 'misconfigured' | 'unavailable' | 'invalid-response';
export type PrivateReader<T> = (token: string) => Promise<
  { ok: true; data: T } | { ok: false; error: PrivateReadError }
>;

export function createPrivateReader<T>(
  location: string | undefined,
  request: RequestResource,
  parse: (value: unknown) => T | null,
): PrivateReader<T> {
  const endpoint = httpsEndpoint(location);

  return async token => {
    if (!endpoint) return { ok: false, error: 'misconfigured' };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await request(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        redirect: 'error',
        signal: controller.signal,
      });
      if (response.status === 401) return { ok: false, error: 'unauthorized' };
      if (!response.ok) return { ok: false, error: 'unavailable' };

      try {
        const data = parse(await response.json());
        return data === null ? { ok: false, error: 'invalid-response' } : { ok: true, data };
      } catch {
        return { ok: false, error: controller.signal.aborted ? 'unavailable' : 'invalid-response' };
      }
    } catch {
      return { ok: false, error: 'unavailable' };
    } finally {
      clearTimeout(timeout);
    }
  };
}
