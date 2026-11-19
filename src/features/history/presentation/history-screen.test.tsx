import { fireEvent, render, screen } from '@testing-library/react-native';

import { type HistoryEntry } from '../domain/history';
import { HistoryScreen } from './history-screen';

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

  await fireEvent.changeText(screen.getByLabelText('Destinatario'), 'jose');
  await fireEvent.changeText(screen.getByLabelText('Monto exacto'), '125,50');
  await fireEvent.changeText(screen.getByLabelText('Fecha'), '2026-01-08');
  await fireEvent.press(screen.getByRole('button', { name: 'Aplicar filtros' }));

  expect(screen.getByText('José Pérez')).toBeOnTheScreen();
  expect(screen.queryByText('Sofía Molina')).toBeNull();

  await fireEvent.press(screen.getByRole('button', { name: 'Limpiar filtros' }));
  expect(screen.getByText('Sofía Molina')).toBeOnTheScreen();
});

it('marca una fecha incorrecta y distingue la falta de resultados', async () => {
  await render(<HistoryScreen state={{ status: 'ready', entries }} onReload={jest.fn()} onBack={jest.fn()} />);

  await fireEvent.changeText(screen.getByLabelText('Fecha'), '2026-02-30');
  await fireEvent.press(screen.getByRole('button', { name: 'Aplicar filtros' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Ingresá una fecha válida en formato AAAA-MM-DD.');

  await fireEvent.changeText(screen.getByLabelText('Fecha'), '2026-02-28');
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
