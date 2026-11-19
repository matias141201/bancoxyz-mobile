import { currencyFractionDigits, formatMoney, majorToMinor, parseMajorAmount } from './money';

describe('money', () => {
  it('obtiene la escala para monedas con cero, dos y tres decimales', () => {
    expect(currencyFractionDigits('JPY')).toBe(0);
    expect(currencyFractionDigits('ARS')).toBe(2);
    expect(currencyFractionDigits('KWD')).toBe(3);
    expect(currencyFractionDigits('ars')).toBeNull();
    expect(currencyFractionDigits('$')).toBeNull();
  });

  it.each([
    ['12.34', 2, 1234],
    [' 12,3 ', 2, 1230],
    ['-001.40', 2, -140],
    ['-0', 2, 0],
    ['4', 0, 4],
    ['999,999', 3, 999999],
  ])('interpreta %s como un monto exacto', (text, digits, expected) => {
    expect(parseMajorAmount(text, digits)).toBe(expected);
  });

  it.each(['', '1,234.56', '0,001', '1.', '2e3', '90071992547409920'])(
    'rechaza el monto inválido %s',
    text => expect(parseMajorAmount(text, 2)).toBeNull(),
  );

  it('rechaza una escala inválida', () => {
    expect(parseMajorAmount('12.34', -1)).toBeNull();
    expect(parseMajorAmount('12.34', 1.2)).toBeNull();
  });

  it('convierte el valor de la API sin contar errores de punto flotante', () => {
    expect(majorToMinor(19.99, 2)).toBe(1999);
    expect(majorToMinor(19.999, 2)).toBeNull();
    expect(majorToMinor(Number.NaN, 2)).toBeNull();
  });

  it('formatea el monto con decimales y código de moneda explícitos', () => {
    expect(formatMoney(123450, 'ARS')).toMatch(/ARS\s+1\.234,50/u);
    expect(formatMoney(120, 'JPY')).toMatch(/JPY\s+120/u);
  });
});
