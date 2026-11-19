import { formatCalendarDate, isCalendarDate, localCalendarDate } from './calendar-date';

it.each(['2024-02-29', '2026-04-30', '0001-01-01'])('reconoce el día de calendario %s', value => {
  expect(isCalendarDate(value)).toBe(true);
});

it.each([null, '2023-02-29', '2026-04-31', '0000-01-01', '2026/03/21', '2026-03-21T00:00:00Z'])(
  'descarta el día inválido %s',
  value => expect(isCalendarDate(value)).toBe(false),
);

it('utiliza el día local y muestra la fecha sin desplazamiento de zona horaria', () => {
  expect(localCalendarDate(new Date(2026, 0, 2, 23, 30))).toBe('2026-01-02');
  expect(formatCalendarDate('2026-01-02')).toBe('02/01/2026');
});
