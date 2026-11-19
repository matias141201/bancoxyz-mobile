import { parseMajorAmount } from '@/shared/domain/money';

const groupedAmount = /^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/u;

export function parseTransferAmount(value: string, fractionDigits: number): number | null {
  return parseMajorAmount(groupedAmount.test(value) ? value.replace(/\./gu, '') : value, fractionDigits);
}

export function formatTransferAmountInput(input: string, previous: string, fractionDigits: number): string {
  if (!/^[\d.]*(?:,\d*)?$/u.test(input)) return previous;

  const comma = input.indexOf(',');
  const addedPeriod = input.split('.').length > previous.split('.').length;
  const typedDecimalPoint = addedPeriod && !groupedAmount.test(input) && fractionDigits > 0;
  const separator = comma >= 0 ? comma : typedDecimalPoint ? input.lastIndexOf('.') : -1;
  const whole = separator < 0 ? input : input.slice(0, separator);
  const decimal = separator < 0 ? '' : input.slice(separator + 1);
  if (separator >= 0 && (fractionDigits === 0 || decimal.length > fractionDigits)) return previous;

  const digits = whole.replace(/\./gu, '').replace(/^0+(?=\d)/u, '');
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/gu, '.');
  return separator < 0 ? grouped : `${grouped || '0'},${decimal}`;
}
