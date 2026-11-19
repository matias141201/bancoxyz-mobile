import { isCalendarDate } from '@/shared/domain/calendar-date';
import { currencyFractionDigits, majorToMinor } from '@/shared/domain/money';

import { parseTransferAmount } from './transfer-amount';
import type { TransferOrder } from './transfer-order';

export type TransferDraft = Readonly<{
  recipientDocument: string;
  amount: string;
  timing: 'now' | 'future';
  date: string;
}>;

type TransferField = 'recipientDocument' | 'amount' | 'balance' | 'date';
type DraftResult = { ok: true; order: TransferOrder } | { ok: false; field: TransferField };
export const maximumDocumentLength = 64;

export function validateTransferDraft(
  draft: TransferDraft, currency: string, today: string, availableBalance: number,
): DraftResult {
  const recipientDocument = draft.recipientDocument.trim();
  if (
    !/^\d+$/u.test(recipientDocument)
    || recipientDocument.length > maximumDocumentLength
  ) {
    return { ok: false, field: 'recipientDocument' };
  }

  const fractionDigits = currencyFractionDigits(currency);
  const amountMinor = fractionDigits === null ? null : parseTransferAmount(draft.amount, fractionDigits);
  if (fractionDigits === null || amountMinor === null || amountMinor <= 0) {
    return { ok: false, field: 'amount' };
  }

  const majorAmount = amountMinor / 10 ** fractionDigits;
  if (majorToMinor(majorAmount, fractionDigits) !== amountMinor) {
    return { ok: false, field: 'amount' };
  }

  const balanceMinor = majorToMinor(availableBalance, fractionDigits);
  const exceedsBalance = balanceMinor === null ? majorAmount > availableBalance : amountMinor > balanceMinor;
  if (!Number.isFinite(availableBalance) || exceedsBalance) {
    return { ok: false, field: 'balance' };
  }

  const date = draft.timing === 'now' ? today : draft.date;
  if (!isCalendarDate(date) || (draft.timing === 'future' && date <= today)) {
    return { ok: false, field: 'date' };
  }

  return { ok: true, order: { recipientDocument, amountMinor, fractionDigits, currency, date } };
}
