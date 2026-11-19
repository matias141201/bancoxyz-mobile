import { isCalendarDate } from '@/shared/domain/calendar-date';
import { currencyFractionDigits, parseMajorAmount } from '@/shared/domain/money';

import type { TransferOrder } from './transfer-order';

export type TransferDraft = Readonly<{
  recipientDocument: string;
  amount: string;
  timing: 'now' | 'future';
  date: string;
}>;

type TransferField = 'recipientDocument' | 'amount' | 'date';
type DraftResult = { ok: true; order: TransferOrder } | { ok: false; field: TransferField };
export const maximumDocumentLength = 64;

export function validateTransferDraft(draft: TransferDraft, currency: string, today: string): DraftResult {
  const recipientDocument = draft.recipientDocument.trim();
  if (
    !recipientDocument
    || recipientDocument.length > maximumDocumentLength
    || /\p{Cc}/u.test(recipientDocument)
  ) {
    return { ok: false, field: 'recipientDocument' };
  }

  const fractionDigits = currencyFractionDigits(currency);
  const amountMinor = fractionDigits === null ? null : parseMajorAmount(draft.amount, fractionDigits);
  if (fractionDigits === null || amountMinor === null || amountMinor <= 0) {
    return { ok: false, field: 'amount' };
  }

  const majorAmount = amountMinor / 10 ** fractionDigits;
  if (parseMajorAmount(String(majorAmount), fractionDigits) !== amountMinor) {
    return { ok: false, field: 'amount' };
  }

  const date = draft.timing === 'now' ? today : draft.date;
  if (!isCalendarDate(date) || (draft.timing === 'future' && date <= today)) {
    return { ok: false, field: 'date' };
  }

  return { ok: true, order: { recipientDocument, amountMinor, fractionDigits, currency, date } };
}
