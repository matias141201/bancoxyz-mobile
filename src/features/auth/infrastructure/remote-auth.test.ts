import { createRemoteAuth } from './remote-auth';

const credentials = { email: 'demo@example.com', password: 'fixture-password' };
const endpoint = 'https://bank.example/login';
const fixture = {
  token: 'fixture-token',
  user: { id: 4, name: 'Cliente de prueba', email: 'demo@example.com' },
};

it('envía el JSON aceptado por la API y transforma la respuesta al modelo de sesión', async () => {
  const http = jest.fn().mockResolvedValue(Response.json(fixture));
  const login = createRemoteAuth(endpoint, http);

  await expect(login(credentials)).resolves.toEqual({
    ok: true,
    session: { token: fixture.token, user: { id: 4, name: 'Cliente de prueba', email: credentials.email } },
  });
  expect(http).toHaveBeenCalledWith(endpoint, expect.objectContaining({
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    redirect: 'error',
    signal: expect.any(AbortSignal),
  }));
});

it.each([
  [401, 'invalid-credentials'],
  [503, 'unavailable'],
])('clasifica una respuesta HTTP %i', async (status, error) => {
  const http = jest.fn().mockResolvedValue(new Response(null, { status }));

  await expect(createRemoteAuth(endpoint, http)(credentials)).resolves.toEqual({ ok: false, error });
});

it.each([
  Response.json({ ...fixture, token: '' }),
  Response.json({ ...fixture, user: undefined }),
  Response.json({ ...fixture, user: { ...fixture.user, id: '4' } }),
  Response.json({ ...fixture, user: { ...fixture.user, name: '' } }),
  Response.json({ ...fixture, user: { ...fixture.user, email: null } }),
  Response.json(null),
  new Response('unexpected text'),
])('rechaza un formato de respuesta inesperado', async body => {
  const http = jest.fn().mockResolvedValue(body);

  await expect(createRemoteAuth(endpoint, http)(credentials)).resolves.toEqual({
    ok: false,
    error: 'invalid-response',
  });
});

it('interpreta un fallo de red como un servicio no disponible', async () => {
  const http = jest.fn().mockRejectedValue(new Error('network error'));

  await expect(createRemoteAuth(endpoint, http)(credentials)).resolves.toEqual({
    ok: false,
    error: 'unavailable',
  });
});

it.each([undefined, 'http://bank.example/login', 'https://user:pwd@bank.example/login', 'not-a-url'])(
  'rechaza configuraciones de conexión inseguras o inválidas',
  async location => {
    const http = jest.fn();

    await expect(createRemoteAuth(location, http)(credentials)).resolves.toEqual({
      ok: false,
      error: 'misconfigured',
    });
    expect(http).not.toHaveBeenCalled();
  },
);

it('muestra un fallo de servicio si el cuerpo de la respuesta supera el tiempo límite', async () => {
  jest.useFakeTimers();

  try {
    const request = jest.fn(async (_url: string, init: RequestInit) => ({
      ok: true,
      status: 200,
      json: () => new Promise<unknown>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      }),
    }));
    const pending = createRemoteAuth(endpoint, request)(credentials);

    await jest.advanceTimersByTimeAsync(10_000);
    await expect(pending).resolves.toEqual({ ok: false, error: 'unavailable' });
  } finally {
    jest.useRealTimers();
  }
});
