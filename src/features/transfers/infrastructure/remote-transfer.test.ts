import type { TransferOrder } from '../application/transfer';
import { createRemoteTransfer } from './remote-transfer';

const order: TransferOrder = {
  amountMinor: 2301,
  fractionDigits: 2,
  currency: 'ARS',
  recipientDocument: '001234',
  date: '2027-01-10',
};
const location = 'https://bank.example/transfer';

it('envía el contrato del PDF con el token de sesión y conserva la fecha', async () => {
  const request = jest.fn().mockResolvedValue(Response.json({ estado: 'éxito' }));

  await expect(createRemoteTransfer(location, request)('fixture-token', order)).resolves.toEqual({ ok: true });
  expect(request).toHaveBeenCalledWith(location, expect.objectContaining({
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer fixture-token',
    },
    redirect: 'error',
    body: JSON.stringify({
      valor: 23.01,
      moneda: 'ARS',
      documentoPayeer: '001234',
      fechaDeTransferencia: '2027-01-10',
    }),
    signal: expect.any(AbortSignal),
  }));
});

it.each([
  [400, 'invalid'],
  [401, 'unauthorized'],
  [503, 'uncertain'],
])('clasifica HTTP %i y realiza un solo intento', async (status, error) => {
  const request = jest.fn().mockResolvedValue(new Response(null, { status }));

  await expect(createRemoteTransfer(location, request)('fixture-token', order)).resolves.toEqual({
    ok: false,
    error,
  });
  expect(request).toHaveBeenCalledTimes(1);
});

it.each([
  [{ estado: 'error' }, 'rejected'],
  [{ resultado: 'desconocido' }, 'uncertain'],
  [null, 'uncertain'],
])('distingue rechazo confirmado y resultado desconocido', async (body, error) => {
  const request = jest.fn().mockResolvedValue(Response.json(body));

  await expect(createRemoteTransfer(location, request)('fixture-token', order)).resolves.toEqual({
    ok: false,
    error,
  });
});

it.each(['https://test:unsafe@bank.example', 'http://bank.example', undefined, 'invalid'])(
  'protege el token ante configuración no HTTPS o inválida',
  async endpoint => {
    const request = jest.fn();

    await expect(createRemoteTransfer(endpoint, request)('fixture-token', order)).resolves.toEqual({
      ok: false,
      error: 'misconfigured',
    });
    expect(request).not.toHaveBeenCalled();
  },
);

it('no reenvía el POST al perder conexión con el servidor', async () => {
  const request = jest.fn().mockRejectedValue(new Error('disconnected'));

  await expect(createRemoteTransfer(location, request)('fixture-token', order)).resolves.toEqual({
    ok: false,
    error: 'uncertain',
  });
  expect(request).toHaveBeenCalledTimes(1);
});

it('clasifica el tiempo de espera agotado como un resultado incierto', async () => {
  jest.useFakeTimers();
  try {
    const request = jest.fn(async (_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    }));
    const transfer = createRemoteTransfer(location, request)('fixture-token', order);

    await jest.advanceTimersByTimeAsync(10_000);
    await expect(transfer).resolves.toEqual({ ok: false, error: 'uncertain' });
    expect(request).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});


it('rechaza una sesión sin token antes de realizar solicitudes', async () => {
  const request = jest.fn();

  await expect(createRemoteTransfer(location, request)('  ', order)).resolves.toEqual({
    ok: false,
    error: 'unauthorized',
  });
  expect(request).not.toHaveBeenCalled();
});

it('interpreta una respuesta imposible de leer como incierta', async () => {
  const request = jest.fn().mockResolvedValue(new Response('not-json'));

  await expect(createRemoteTransfer(location, request)('fixture-token', order)).resolves.toEqual({
    ok: false,
    error: 'uncertain',
  });
});
