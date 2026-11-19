import { createPrivateReader } from '@/shared/network/private-reader';

import type { Balance } from '../domain/balance';

export function createRemoteBalance(location: string | undefined, request: typeof fetch) {
  return createPrivateReader(location, request, parseBalance);
}

function parseBalance(value: unknown): Balance | null {
  if (typeof value !== 'object' || !value || !('accountBalance' in value) || !('currency' in value)) {
    return null;
  }
  const { accountBalance, currency } = value;

  if (typeof accountBalance !== 'number' || !Number.isFinite(accountBalance) ||
      typeof currency !== 'string' || !/^[A-Z]{3}$/u.test(currency)) {
    return null;
  }
  return { amount: accountBalance, currency };
}
