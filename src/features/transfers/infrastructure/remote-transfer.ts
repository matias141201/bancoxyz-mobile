import { httpsEndpoint } from '@/shared/network/https-endpoint';

import type { TransferOrder, TransferResult } from '../application/transfer';

export type TransferRequest = (url: string, init: RequestInit) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

const transferTimeoutMs = 10_000;

async function readOutcome(response: Awaited<ReturnType<TransferRequest>>): Promise<TransferResult> {
  if (response.status === 400) return { ok: false, error: 'invalid' };
  if (response.status === 401) return { ok: false, error: 'unauthorized' };
  if (!response.ok) return { ok: false, error: 'uncertain' };

  const data: unknown = await response.json();
  if (typeof data === 'object' && data !== null && 'estado' in data) {
    if (data.estado === 'éxito') return { ok: true };
    if (data.estado === 'error') return { ok: false, error: 'rejected' };
  }

  return { ok: false, error: 'uncertain' };
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
        body: JSON.stringify({
          valor: transfer.amountMinor / 10 ** transfer.fractionDigits,
          moneda: transfer.currency,
          documentoPayeer: transfer.recipientDocument,
          fechaDeTransferencia: transfer.date,
        }),
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
