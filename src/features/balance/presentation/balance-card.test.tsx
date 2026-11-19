import { fireEvent, render, screen } from '@testing-library/react-native';

import { BalanceCard } from './balance-card';

it('muestra carga inicial sin simular un saldo', async () => {
  await render(<BalanceCard state={{ status: 'loading' }} onReload={jest.fn()} />);

  expect(screen.getByText('Consultando tu saldo…')).toBeOnTheScreen();
});

it('muestra un saldo con su moneda y permite actualizar', async () => {
  const reload = jest.fn();
  await render(<BalanceCard state={{ status: 'ready', data: { amount: 123.45, currency: 'USD' } }} onReload={reload} />);

  expect(screen.getByText(/123,45/)).toBeOnTheScreen();
  expect(screen.getByText('USD')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Actualizar saldo' }));
  expect(reload).toHaveBeenCalledTimes(1);
});

it('explica el error y permite reintentar', async () => {
  const reload = jest.fn();
  await render(<BalanceCard state={{ status: 'error', message: 'No pudimos consultar tu saldo.' }} onReload={reload} />);

  expect(screen.getByText('No pudimos consultar tu saldo.')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
  expect(reload).toHaveBeenCalledTimes(1);
});
