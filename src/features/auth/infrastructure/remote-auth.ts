import { httpsEndpoint } from '@/shared/network/https-endpoint';

import type { Session, SignIn, SignInResult } from '../application/sign-in';

type RequestLogin = (url: string, init: RequestInit) => Promise<Pick<Response, 'status' | 'ok' | 'json'>>;

function parseSession(data: unknown): Session | null {
  if (typeof data !== 'object' || data === null || !('token' in data) || !('user' in data)) {
    return null;
  }

  const { token, user } = data;
  if (
    typeof token !== 'string' || !token.trim() ||
    typeof user !== 'object' || user === null ||
    !('id' in user) || !('name' in user) || !('email' in user)
  ) {
    return null;
  }

  const { id, name, email } = user;

  if (typeof id !== 'number' || !Number.isSafeInteger(id) || typeof name !== 'string' ||
      !name.trim() || typeof email !== 'string' || !email.trim()) {
    return null;
  }

  return { token, user: { id, name, email } };
}

async function readSession(response: Awaited<ReturnType<RequestLogin>>): Promise<SignInResult> {
  if (response.status === 401) return { ok: false, error: 'invalid-credentials' };
  if (!response.ok) return { ok: false, error: 'unavailable' };

  try {
    const session = parseSession(await response.json());
    return session ? { ok: true, session } : { ok: false, error: 'invalid-response' };
  } catch {
    return { ok: false, error: 'invalid-response' };
  }
}

export function createRemoteAuth(location: string | undefined, request: RequestLogin): SignIn {
  const endpoint = httpsEndpoint(location);

  return async ({ email, password }) => {
    if (!endpoint) return { ok: false, error: 'misconfigured' };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await request(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
        redirect: 'error',
        signal: controller.signal,
      });

      const result = await readSession(response);
      return controller.signal.aborted ? { ok: false, error: 'unavailable' } : result;
    } catch {
      return { ok: false, error: 'unavailable' };
    } finally {
      clearTimeout(timeout);
    }
  };
}
