export const maxCurrencyFractionDigits = 4;

const currencyCode = /^[A-Z]{3}$/u;
const decimalAmount = /^(-?)(\d+)(?:[,.](\d+))?$/u;
const locale = 'es-AR';

function moneyFormatter(currency: string): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'code' });
}

export function currencyFractionDigits(currency: string): number | null {
  if (!currencyCode.test(currency)) return null;
  return moneyFormatter(currency).resolvedOptions().maximumFractionDigits ?? null;
}

export function parseMajorAmount(input: string, fractionDigits: number): number | null {
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > maxCurrencyFractionDigits) {
    return null;
  }

  const match = decimalAmount.exec(input.trim());
  if (!match) return null;

  const [, sign, whole, fraction = ''] = match;
  if (fraction.length > fractionDigits) return null;

  const minor = Number(whole + fraction.padEnd(fractionDigits, '0'));
  if (!Number.isSafeInteger(minor)) return null;

  return sign === '-' && minor !== 0 ? -minor : minor;
}

export function majorToMinor(amount: number, fractionDigits: number): number | null {
  return parseMajorAmount(String(amount), fractionDigits);
}

export function formatMoney(amountMinor: number, currency: string): string {
  const formatter = moneyFormatter(currency);
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 0;
  const scale = 10 ** fractionDigits;
  const whole = Math.trunc(amountMinor / scale);
  const fraction = String(Math.abs(amountMinor % scale)).padStart(fractionDigits, '0');

  return formatter
    .formatToParts(whole)
    .map(part => part.type === 'fraction' ? fraction : part.value)
    .join('');
}
