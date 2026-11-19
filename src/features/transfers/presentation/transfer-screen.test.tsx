import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { TransferResult } from '../application/transfer';
import { TransferScreen } from './transfer-screen';

jest.mock('@expo/ui/community/datetime-picker', () => {
  const { TextInput } = jest.requireActual('react-native');
  return {
    DateTimePicker: ({ onValueChange }: { onValueChange: (event: unknown, date: Date) => void }) => (
      <TextInput
        accessibilityLabel="Fecha de transferencia"
        onChangeText={(value: string) => {
          const [year, month, day] = value.split('-').map(Number);
          onValueChange({}, new Date(year, month - 1, day, 12));
        }}
      />
    ),
  };
});

const today = () => new Date(2026, 10, 19, 12);
const initialMetrics = {
  frame: { x: 0, y: 0, width: 400, height: 800 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

async function renderTransfer(clock = today, availableBalance = 5000) {
  const submit = jest.fn();
  const onBack = jest.fn();
  const onSuccess = jest.fn();
  const onUnauthorized = jest.fn();
  const onViewHistory = jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <TransferScreen
        currency="ARS"
        availableBalance={availableBalance}
        submit={submit}
        onBack={onBack}
        onSuccess={onSuccess}
        onUnauthorized={onUnauthorized}
        onViewHistory={onViewHistory}
        clock={clock}
      />
    </SafeAreaProvider>,
  );

  return { submit, onBack, onSuccess, onUnauthorized, onViewHistory };
}

async function fillDraft() {
  await fireEvent.changeText(screen.getByLabelText('Documento del destinatario'), '001234');
  await fireEvent.changeText(screen.getByLabelText('Monto en ARS'), '12,50');
}

async function press(name: string) {
  await fireEvent.press(screen.getByRole('button', { name }));
}

it('muestra la aceptación del servidor y permite consultar movimientos desde el recibo', async () => {
  const { submit, onSuccess, onViewHistory } = await renderTransfer();
  submit.mockResolvedValue({ ok: true });

  await fillDraft();
  await press('Enviar transferencia');
  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByText('001234')).toBeOnTheScreen();
  expect(screen.getByText('19/11/2026')).toBeOnTheScreen();
  await press('Confirmar transferencia');

  expect(await screen.findByRole('header', { name: 'Transferencia exitosa' })).toBeOnTheScreen();
  expect(screen.getAllByRole('button').map(button => button.props.accessibilityLabel)).toEqual([
    'Volver al inicio', 'Ver historial',
  ]);
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ amountMinor: 1250, date: '2026-11-19' }));
  await press('Ver historial');
  expect(onViewHistory).toHaveBeenCalledTimes(1);
  expect(onSuccess).not.toHaveBeenCalled();
  await press('Volver al inicio');
  expect(onSuccess).toHaveBeenCalledTimes(1);
});

it('requiere una fecha futura válida y preserva los campos al corregir un rechazo', async () => {
  const { submit } = await renderTransfer();
  submit.mockResolvedValueOnce({ ok: false, error: 'rejected' }).mockResolvedValueOnce({ ok: true });

  await fillDraft();
  await press('Programar envío');
  await fireEvent.changeText(screen.getByLabelText('Fecha de transferencia'), '2026-11-18');
  await press('Programar transferencia');
  expect(screen.getByText('Elegí una fecha posterior a hoy.')).toBeOnTheScreen();
  expect(submit).not.toHaveBeenCalled();

  await fireEvent.changeText(screen.getByLabelText('Fecha de transferencia'), '2026-12-01');
  await press('Programar transferencia');
  await press('Confirmar transferencia');
  expect(await screen.findByText('El banco rechazó la transferencia. Revisá los datos e intentá de nuevo.')).toBeOnTheScreen();

  await press('Editar datos');
  expect(screen.getByLabelText('Documento del destinatario')).toHaveDisplayValue('001234');
  await press('Programar transferencia');
  await press('Confirmar transferencia');
  expect(await screen.findByRole('header', { name: 'Transferencia programada' })).toBeOnTheScreen();
  expect(submit).toHaveBeenLastCalledWith(expect.objectContaining({ date: '2026-12-01' }));
});

it('evita el doble envío y orienta al historial ante un resultado incierto', async () => {
  const { submit, onViewHistory } = await renderTransfer();
  const pending = Promise.withResolvers<TransferResult>();
  submit.mockReturnValue(pending.promise);
  await fillDraft();
  await press('Enviar transferencia');
  await press('Confirmar transferencia');
  await press('Confirmar transferencia');
  expect(submit).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Confirmar transferencia' })).toBeDisabled();

  await act(async () => {
    pending.resolve({ ok: false, error: 'uncertain' });
  });

  expect(screen.getByRole('header', { name: 'Resultado pendiente' })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Confirmar transferencia' })).toBeNull();
  await press('Ver movimientos');
  expect(onViewHistory).toHaveBeenCalledTimes(1);
});

it('devuelve el control de una sesión vencida a la aplicación', async () => {
  const { submit, onUnauthorized } = await renderTransfer();
  submit.mockResolvedValue({ ok: false, error: 'unauthorized' });
  await fillDraft();
  await press('Enviar transferencia');
  await press('Confirmar transferencia');

  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});


it('pide revisar el detalle de una transferencia inmediata si cambió el día', async () => {
  const clock = jest.fn(today);
  const { submit } = await renderTransfer(clock);
  submit.mockResolvedValue({ ok: true });
  await fillDraft();
  await press('Enviar transferencia');
  clock.mockReturnValue(new Date(2026, 10, 20, 1));
  await press('Confirmar transferencia');

  expect(submit).not.toHaveBeenCalled();
  expect(screen.getByText('Los datos cambiaron. Revisá el detalle antes de confirmar.')).toBeOnTheScreen();
  expect(screen.getByText('20/11/2026')).toBeOnTheScreen();
  await press('Confirmar transferencia');
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({ date: '2026-11-20' }));
});

it('preserva la incertidumbre cuando el caso de uso falla de forma inesperada', async () => {
  const { submit, onBack } = await renderTransfer();
  submit.mockRejectedValue(new Error('network failure'));
  await fillDraft();
  await press('Enviar transferencia');
  await press('Confirmar transferencia');

  expect(await screen.findByRole('header', { name: 'Resultado pendiente' })).toBeOnTheScreen();
  await press('Volver al inicio');
  expect(onBack).toHaveBeenCalledTimes(1);
});


it('conserva los ceros del documento y agrupa el monto mientras se escribe', async () => {
  const { submit } = await renderTransfer();
  submit.mockResolvedValue({ ok: true });
  const document = screen.getByLabelText('Documento del destinatario');
  const amount = screen.getByLabelText('Monto en ARS');

  await fireEvent.changeText(document, '00-A12.3');
  await fireEvent.changeText(amount, '1000');
  expect(document).toHaveDisplayValue('00123');
  expect(amount).toHaveDisplayValue('1.000');

  await fireEvent.changeText(amount, '1.000,25');
  await press('Enviar transferencia');
  await press('Confirmar transferencia');
  expect(submit).toHaveBeenCalledWith(expect.objectContaining({
    recipientDocument: '00123', amountMinor: 100025,
  }));
});

it.each(['Enviar transferencia', 'Programar transferencia'])('rechaza un saldo insuficiente al tocar %s', async action => {
  const { submit } = await renderTransfer(today, 10);

  await fillDraft();
  if (action === 'Programar transferencia') await press('Programar envío');
  await press(action);

  expect(screen.getByRole('alert')).toHaveTextContent('El monto supera el saldo disponible.');
  expect(screen.getByLabelText('Monto en ARS')).toHaveDisplayValue('12,50');
  expect(submit).not.toHaveBeenCalled();
});

it('regresa a la transferencia inmediata al cancelar la programación', async () => {
  await renderTransfer();
  expect(screen.queryByLabelText('Fecha de transferencia')).toBeNull();

  await press('Programar envío');
  expect(screen.getByRole('button', { name: 'Programar transferencia' })).toBeOnTheScreen();
  await press('Cancelar programación');

  expect(screen.queryByLabelText('Fecha de transferencia')).toBeNull();
  expect(screen.getByRole('button', { name: 'Enviar transferencia' })).toBeOnTheScreen();
});

it('vuelve desde la revisión al formulario con el documento y el monto', async () => {
  const { onBack } = await renderTransfer();
  await fillDraft();
  await press('Enviar transferencia');
  await press('Volver');

  expect(onBack).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Documento del destinatario')).toHaveDisplayValue('001234');
  expect(screen.getByLabelText('Monto en ARS')).toHaveDisplayValue('12,50');
});
