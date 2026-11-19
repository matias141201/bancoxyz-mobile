import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { localCalendarDate } from '@/shared/domain/calendar-date';

import { type HistoryEntry } from '../domain/history';
import { HistoryScreen } from './history-screen';

jest.mock('@expo/ui/community/datetime-picker', () => {
  const { TextInput } = jest.requireActual('react-native');

  return {
    DateTimePicker: jest.fn(({ onValueChange, testID }: React.ComponentProps<typeof DateTimePicker>) => (
      <TextInput
        testID={testID}
        onChangeText={(value: string) => {
          const [year, month, day] = value.split('-').map(Number);
          const date = new Date(year, month - 1, day, 12);
          onValueChange?.({ nativeEvent: { timestamp: date.getTime(), utcOffset: -date.getTimezoneOffset() } }, date);
        }}
      />
    )),
  };
});

const entries = [
  { key: '0', recipientName: 'José Pérez', currency: 'ARS', date: '2026-01-08', amountMinor: 12550 },
  { key: '1', recipientName: 'Sofía Molina', currency: 'USD', date: '2026-01-10', amountMinor: 12550 },
] satisfies readonly HistoryEntry[];

it('presenta el historial y aplica o limpia los tres filtros', async () => {
  await render(<HistoryScreen state={{ status: 'ready', entries }} onReload={jest.fn()} onBack={jest.fn()} />);

  expect(screen.getByRole('header', { name: 'Historial' })).toBeOnTheScreen();
  expect(screen.getByText('José Pérez')).toBeOnTheScreen();
  expect(screen.getByText('Sofía Molina')).toBeOnTheScreen();
  expect(screen.getByText(/ARS\s+125,50/u)).toBeOnTheScreen();
  expect(screen.getByText('08/01/2026')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Destinatario')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Filtro', expanded: false }));
  expect(screen.getByRole('button', { name: 'Filtro', expanded: true })).toBeOnTheScreen();
  await fireEvent.changeText(screen.getByLabelText('Destinatario'), 'jose');
  await fireEvent.changeText(screen.getByLabelText('Monto exacto'), '125,50');
  await fireEvent.press(screen.getByRole('button', { name: 'Elegir fecha' }));
  await fireEvent.changeText(screen.getByTestId('history-date-picker'), '2026-01-08');
  await fireEvent.press(screen.getByRole('button', { name: 'Aplicar filtros' }));

  expect(screen.getByText('José Pérez')).toBeOnTheScreen();
  expect(screen.queryByText('Sofía Molina')).toBeNull();
  expect(screen.queryByLabelText('Destinatario')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Filtro', expanded: false }));
  expect(screen.getByLabelText('Destinatario')).toHaveDisplayValue('jose');
  await fireEvent.press(screen.getByRole('button', { name: 'Limpiar filtros' }));
  expect(screen.getByText('Sofía Molina')).toBeOnTheScreen();
});

it('limita el calendario a hoy y distingue una fecha sin transferencias', async () => {
  await render(<HistoryScreen state={{ status: 'ready', entries }} onReload={jest.fn()} onBack={jest.fn()} />);

  await fireEvent.press(screen.getByRole('button', { name: 'Filtro' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Elegir fecha' }));
  const maximum = jest.mocked(DateTimePicker).mock.lastCall?.[0].maximumDate;
  expect(maximum && localCalendarDate(maximum)).toEqual(localCalendarDate(new Date()));

  await fireEvent.changeText(screen.getByTestId('history-date-picker'), '2026-02-28');
  await fireEvent.press(screen.getByRole('button', { name: 'Aplicar filtros' }));
  expect(screen.getByText('No hay transferencias para el 28/02/2026')).toBeOnTheScreen();
});

it('mantiene abierto el filtro cuando es inválido y distingue filtros combinados sin coincidencias', async () => {
  await render(<HistoryScreen state={{ status: 'ready', entries }} onReload={jest.fn()} onBack={jest.fn()} />);

  await fireEvent.press(screen.getByRole('button', { name: 'Filtro' }));
  await fireEvent.changeText(screen.getByLabelText('Monto exacto'), '125,');
  await fireEvent.press(screen.getByRole('button', { name: 'Aplicar filtros' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Ingresá un monto válido sin separador de miles.');
  expect(screen.getByRole('button', { name: 'Filtro', expanded: true })).toBeOnTheScreen();

  await fireEvent.changeText(screen.getByLabelText('Monto exacto'), '10');
  await fireEvent.press(screen.getByRole('button', { name: 'Elegir fecha' }));
  await fireEvent.changeText(screen.getByTestId('history-date-picker'), '2026-01-08');
  await fireEvent.press(screen.getByRole('button', { name: 'Aplicar filtros' }));
  expect(screen.getByText('No hay coincidencias')).toBeOnTheScreen();
});

it('muestra la carga, permite reintentar y vuelve al inicio', async () => {
  const onBack = jest.fn();
  const onReload = jest.fn();
  const result = await render(<HistoryScreen state={{ status: 'loading' }} onReload={onReload} onBack={onBack} />);
  expect(screen.getByText('Cargando transferencias…')).toBeOnTheScreen();
  expect(screen.queryByText('Todavía no hay transferencias')).toBeNull();

  await result.rerender(<HistoryScreen state={{ status: 'error', message: 'Revisá tu conexión.' }} onReload={onReload} onBack={onBack} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Revisá tu conexión.');
  await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Volver al inicio' }));
  expect(onReload).toHaveBeenCalledTimes(1);
  expect(onBack).toHaveBeenCalledTimes(1);

  await result.rerender(<HistoryScreen state={{ status: 'ready', entries: [] }} onReload={onReload} onBack={onBack} />);
  expect(screen.getByText('Todavía no hay transferencias')).toBeOnTheScreen();
});

it('conserva los movimientos mientras actualiza y avisa si la actualización falla', async () => {
  const onReload = jest.fn();
  const onBack = jest.fn();
  const result = await render(
    <HistoryScreen state={{ status: 'ready', entries, refreshing: true }} onReload={onReload} onBack={onBack} />,
  );
  expect(screen.getByText('José Pérez')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Actualizar historial' })).toBeDisabled();

  await result.rerender(
    <HistoryScreen
      state={{ status: 'ready', entries, message: 'No pudimos actualizar los movimientos.' }}
      onReload={onReload}
      onBack={onBack}
    />,
  );

  expect(screen.getByText('José Pérez')).toBeOnTheScreen();
  expect(screen.getByRole('alert')).toHaveTextContent('No pudimos actualizar los movimientos.');
  await fireEvent.press(screen.getByRole('button', { name: 'Actualizar historial' }));
  expect(onReload).toHaveBeenCalledTimes(1);
});
