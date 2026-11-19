import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AccountScreen } from './account-screen';

const metrics = {
  frame: { x: 0, y: 0, width: 400, height: 800 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

it('abre Transferir e Historial y pide confirmación antes de cerrar sesión', async () => {
  const onSignOut = jest.fn();
  const onHistory = jest.fn();
  const onTransfer = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <AccountScreen
        name="Matías"
        balance={{ status: 'ready', data: { amount: 20, currency: 'ARS' } }}
        onReload={jest.fn()}
        onSignOut={onSignOut}
        onHistory={onHistory}
        onTransfer={onTransfer}
      />
    </SafeAreaProvider>,
  );

  const press = async (name: string) => fireEvent.press(screen.getByRole('button', { name }));
  await press('Transferir');
  await press('Historial');
  expect(onTransfer).toHaveBeenCalledTimes(1);
  expect(onHistory).toHaveBeenCalledTimes(1);

  await press('Cerrar sesión');
  expect(screen.getByText('¿Cerrar sesión?')).toBeOnTheScreen();
  expect(onSignOut).not.toHaveBeenCalled();

  await press('Cancelar');
  expect(screen.queryByText('¿Cerrar sesión?')).not.toBeOnTheScreen();
  expect(onSignOut).not.toHaveBeenCalled();

  await press('Cerrar sesión');
  await press('Sí, cerrar sesión');
  expect(onSignOut).toHaveBeenCalledTimes(1);
});
