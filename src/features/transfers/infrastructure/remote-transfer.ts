import { httpsEndpoint } from '@/shared/network/https-endpoint';

import type { TransferOrder, TransferResult } from '../application/transfer';

export type TransferRequest = (url: string, init: RequestInit) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

const transferTimeoutMs = 10_000;

async function readOutcome(response: Awaited<ReturnType<TransferRequest>>): Promise<TransferResult> {
  const httpStatus = response.status;
  if (httpStatus === 400) return { ok: false, error: 'invalid', httpStatus };
  if (httpStatus === 401) return { ok: false, error: 'unauthorized', httpStatus };
  if (!response.ok) return { ok: false, error: 'uncertain', httpStatus };

  try {
    const data: unknown = await response.json();
    if (typeof data === 'object' && data !== null) {
      if ('status' in data) {
        if (data.status === 'success') return { ok: true };
        if (data.status === 'error') return { ok: false, error: 'rejected', httpStatus };
      } else if ('estado' in data) {
        if (data.estado === 'éxito') return { ok: true };
        if (data.estado === 'error') return { ok: false, error: 'rejected', httpStatus };
      }
    }
  } catch {
    return { ok: false, error: 'uncertain', httpStatus };
  }

  return { ok: false, error: 'uncertain', httpStatus };
}

function transferBody({ amountMinor, fractionDigits, currency, recipientDocument, date }: TransferOrder) {
  const amount = amountMinor / 10 ** fractionDigits;

  // Keep the field variants from the verified request until BancoXYZ publishes the required keys.
  return {
    value: amount,
    amount,
    valor: amount,
    currency,
    moneda: currency,
    documentPayeer: recipientDocument,
    payeerDocument: recipientDocument,
    documentoPayeer: recipientDocument,
    transferDate: date,
    date,
    fechaDeTransferencia: date,
  };
}

export function createRemoteTransfer(location: string | undefined, request: TransferRequest) {
  const endpoint = httpsEndpoint(location);

  return async (token: string, transfer: TransferOrder): Promise<TransferResult> => {
    if (!endpoint) return { ok: false, error: 'misconfigured' };
    if (!token.trim()) return { ok: false, error: 'unauthorized' };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), transferTimeoutMs);
    try {
      const response = await request(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        redirect: 'error',
        body: JSON.stringify(transferBody(transfer)),
        signal: controller.signal,
      });

      return await readOutcome(response);
    } catch {
      return { ok: false, error: 'uncertain' };
    } finally {
      clearTimeout(timeout);
    }
  };
}
