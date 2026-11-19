import { filterHistory, parseHistory, validateHistoryFilters } from './history';

const transfer = {
  value: 125.5,
  date: '2026-01-08',
  currency: 'ARS',
  payeer: { document: '00042', name: 'José Pérez' },
};

const alternate = {
  ...transfer,
  currency: 'USD',
  date: '2026-01-10',
  payeer: { document: '00043', name: 'Sofía Molina' },
};

const baseFilters = { recipient: '', amount: '', date: '' };

it('valida y ordena el historial por fecha más reciente', () => {
  const response = Object.freeze({ message: 'OK', transfers: Object.freeze([transfer, alternate]) });
  const entries = parseHistory(response);

  expect(entries?.map(entry => entry.recipientName)).toEqual(['Sofía Molina', 'José Pérez']);
  expect(entries?.[1]).toMatchObject({
    date: '2026-01-08',
    amountMinor: 12550,
    currency: 'ARS',
    recipientName: 'José Pérez',
  });
  expect(response.transfers[0]).toBe(transfer);
});

it('admite una lista vacía y preserva movimientos idénticos como filas distintas', () => {
  expect(parseHistory({ message: 'OK', transfers: [] })).toEqual([]);
  const entries = parseHistory({ message: 'OK', transfers: [transfer, transfer] }) ?? [];
  expect(entries).toHaveLength(2);
  expect(new Set(entries.map(entry => entry.key)).size).toBe(2);
});

it.each([
  null,
  { transfers: [] },
  { message: 'OK', transfers: false },
  { message: 'OK', transfers: [null] },
  { message: 'OK', transfers: [{ ...transfer, value: '100' }] },
  { message: 'OK', transfers: [{ ...transfer, value: 1.333 }] },
  { message: 'OK', transfers: [{ ...transfer, date: '2026-02-30' }] },
  { message: 'OK', transfers: [{ ...transfer, currency: 'pesos' }] },
  { message: 'OK', transfers: [{ ...transfer, payeer: {} }] },
])('rechaza una respuesta incoherente de historial', response => {
  expect(parseHistory(response)).toBeNull();
});

it('filtra independientemente por nombre, monto y fecha o aplica todos a la vez', () => {
  const entries = parseHistory({
    message: 'OK',
    transfers: [transfer, alternate, { ...alternate, value: 125.51 }],
  }) ?? [];

  expect(filterHistory(entries, { ...baseFilters, recipient: 'JOSE perez' })).toHaveLength(1);
  expect(filterHistory(entries, { ...baseFilters, amount: '125,50' })).toHaveLength(2);
  expect(filterHistory(entries, { ...baseFilters, date: '2026-01-10' })).toHaveLength(2);
  expect(filterHistory(entries, { recipient: 'sofia', amount: '125.50', date: '2026-01-10' })).toHaveLength(1);
  expect(filterHistory(entries, { recipient: 'sofia', amount: '125,50', date: '2026-01-08' })).toHaveLength(0);
  expect(filterHistory(entries, baseFilters)).toHaveLength(3);
});

it('detecta filtros fuera de formato', () => {
  expect(validateHistoryFilters({ ...baseFilters, amount: '10,' })).toBe('amount');
  expect(validateHistoryFilters({ ...baseFilters, date: '2026-02-30' })).toBe('date');
  expect(validateHistoryFilters({ ...baseFilters, date: ' 2026-01-08 ', amount: '125,5' })).toBeNull();
});
