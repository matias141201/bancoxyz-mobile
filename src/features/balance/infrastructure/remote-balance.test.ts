import { createRemoteBalance } from './remote-balance';

const endpoint = 'https://bank.example/balance';

it('lee saldo y moneda del resultado y autentica la consulta', async () => {
  const request = jest.fn().mockResolvedValue(Response.json({ accountBalance: 1750.25, currency: 'USD' }));

  await expect(createRemoteBalance(endpoint, request)('fixture-token')).resolves.toEqual({
    ok: true,
    data: { amount: 1750.25, currency: 'USD' },
  });
  expect(request).toHaveBeenCalledWith(endpoint, expect.objectContaining({
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: 'Bearer fixture-token' },
    redirect: 'error',
  }));
});

it.each([
  [{ accountBalance: 100, currency: 'not currency' }],
  [{ accountBalance: '100', currency: 'USD' }],
  ['invalid'],
  [null],
])('rechaza un saldo inválido', async body => {
  const request = jest.fn().mockResolvedValue(Response.json(body));

  await expect(createRemoteBalance(endpoint, request)('fixture-token')).resolves.toEqual({
    ok: false, error: 'invalid-response',
  });
});

it.each([[401, 'unauthorized'], [503, 'unavailable']])('clasifica HTTP %i', async (status, error) => {
  const request = jest.fn().mockResolvedValue(new Response(null, { status }));

  await expect(createRemoteBalance(endpoint, request)('fixture-token')).resolves.toEqual({ ok: false, error });
});

it('rechaza una URL sin HTTPS sin iniciar una solicitud', async () => {
  const request = jest.fn();

  await expect(createRemoteBalance('http://bank.example/balance', request)('fixture-token')).resolves.toEqual({
    ok: false, error: 'misconfigured',
  });
  expect(request).not.toHaveBeenCalled();
});

it('permite reintentar tras un fallo de red', async () => {
  const request = jest.fn().mockRejectedValue(new Error('offline'));

  await expect(createRemoteBalance(endpoint, request)('fixture-token')).resolves.toEqual({
    ok: false, error: 'unavailable',
  });
});
