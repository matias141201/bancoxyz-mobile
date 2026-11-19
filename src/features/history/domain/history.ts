import { isCalendarDate } from '@/shared/domain/calendar-date';
import {
  currencyFractionDigits, majorToMinor, maxCurrencyFractionDigits, parseMajorAmount,
} from '@/shared/domain/money';

export type HistoryEntry = Readonly<{
  key: string;
  date: string;
  amountMinor: number;
  currency: string;
  recipientName: string;
}>;

export type HistoryFilters = Readonly<{ recipient: string; amount: string; date: string }>;
export type InvalidHistoryFilter = 'amount' | 'date';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseEntry(value: unknown, index: number): HistoryEntry | null {
  if (!isRecord(value)) return null;

  const { currency, date, payeer, value: amount } = value;
  if (typeof currency !== 'string' || !isCalendarDate(date) || typeof amount !== 'number') return null;

  if (!isRecord(payeer) || typeof payeer.document !== 'string' || !payeer.document.trim()
      || typeof payeer.name !== 'string' || !payeer.name.trim()) return null;

  const precision = currencyFractionDigits(currency);
  if (precision === null) return null;

  const amountMinor = majorToMinor(amount, precision);
  if (amountMinor === null) return null;

  return { key: String(index), date, amountMinor, currency, recipientName: payeer.name.trim() };
}

export function parseHistory(data: unknown): readonly HistoryEntry[] | null {
  if (!isRecord(data) || typeof data.message !== 'string' || !Array.isArray(data.transfers)) return null;

  const entries = data.transfers.map(parseEntry);
  if (!entries.every(entry => entry !== null)) return null;

  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

export function validateHistoryFilters(filters: HistoryFilters): InvalidHistoryFilter | null {
  const amount = filters.amount.trim();
  const date = filters.date.trim();

  if (amount && parseMajorAmount(amount, maxCurrencyFractionDigits) === null) return 'amount';
  if (date && !isCalendarDate(date)) return 'date';
  return null;
}

export function filterHistory(entries: readonly HistoryEntry[], filters: HistoryFilters): readonly HistoryEntry[] {
  const name = normalizeName(filters.recipient);
  const amount = filters.amount.trim();
  const date = filters.date.trim();
  const searchedAmounts = new Map<string, number | null>();

  return entries.filter(entry => {
    if (date && entry.date !== date) return false;
    if (name && !normalizeName(entry.recipientName).includes(name)) return false;
    if (!amount) return true;

    if (!searchedAmounts.has(entry.currency)) {
      const digits = currencyFractionDigits(entry.currency);
      searchedAmounts.set(entry.currency, digits === null ? null : parseMajorAmount(amount, digits));
    }

    return searchedAmounts.get(entry.currency) === entry.amountMinor;
  });
}
