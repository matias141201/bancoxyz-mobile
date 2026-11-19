import { act, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import HomeRoute from '@/app/home';
import HistoryRoute from '@/app/history';
import IndexRoute from '@/app/index';
import TransferRoute from '@/app/transfer';
import { readBalance } from '@/composition/balance';
import { readHistory } from '@/composition/history';
import { signIn } from '@/composition/sign-in';
import { sendTransfer } from '@/composition/transfer';
import type { SignInResult } from '@/features/auth/application/sign-in';

jest.mock('@/composition/balance', () => ({ readBalance: jest.fn() }));
jest.mock('@/composition/history', () => ({ readHistory: jest.fn() }));
jest.mock('@/composition/sign-in', () => ({ signIn: jest.fn() }));
jest.mock('@/composition/transfer', () => ({ sendTransfer: jest.fn() }));

const signInMock = jest.mocked(signIn);
const sendTransferMock = jest.mocked(sendTransfer);
const readHistoryMock = jest.mocked(readHistory);
const readBalanceMock = jest.mocked(readBalance);
const session = { token: 'fixture-token', user: { id: 7, name: 'Cliente de prueba', email: 'demo@example.com' } };
const routes = { _layout: RootLayout, index: IndexRoute, home: HomeRoute, history: HistoryRoute, transfer: TransferRoute };

async function fillLogin() {
  await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'demo@example.com');
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'fixture-password');
}

beforeEach(() => {
  signInMock.mockReset();
  sendTransferMock.mockReset();
  readHistoryMock.mockReset().mockResolvedValue({ ok: true, data: [] });
  readBalanceMock.mockReset().mockResolvedValue({ ok: true, data: { amount: 1500, currency: 'USD' } });
});

it('protege el inicio incluso si se abre un enlace directo', async () => {
  await renderRouter(routes, { initialUrl: '/home' });

  expect(await screen.findByRole('header', { name: 'Ingresá a tu cuenta' })).toBeOnTheScreen();
  expect(screen).toHavePathname('/');
});

it('mantiene el ingreso deshabilitado hasta completar credenciales válidas', async () => {
  await renderRouter(routes, { initialUrl: '/' });
  const submit = () => screen.getByRole('button', { name: 'Ingresar' });

  expect(submit()).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'correo-inválido');
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'fixture-password');
  expect(submit()).toBeDisabled();
  await fireEvent.press(submit());
  expect(signInMock).not.toHaveBeenCalled();

  await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'demo@example.com');
  expect(submit()).toBeEnabled();
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), '');
  expect(submit()).toBeDisabled();
  expect(signInMock).not.toHaveBeenCalled();
});

it('activa la sesión ante una respuesta válida y permite cerrarla', async () => {
  signInMock.mockResolvedValue({
    ok: true,
    session,
  });
  await renderRouter(routes, { initialUrl: '/' });
  await fillLogin();
  await fireEvent.press(screen.getByRole('button', { name: 'Ingresar' }));

  expect(await screen.findByRole('header', { name: 'Hola, Cliente de prueba' })).toBeOnTheScreen();
  expect(screen).toHavePathname('/home');

  await fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión' }));
  expect(screen.getByText('¿Cerrar sesión?')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen).toHavePathname('/home');

  await fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Sí, cerrar sesión' }));
  expect(await screen.findByRole('header', { name: 'Ingresá a tu cuenta' })).toBeOnTheScreen();
  expect(screen).toHavePathname('/');
});

it('impide solicitudes simultáneas y permite reintentar tras un rechazo', async () => {
  const deferred = Promise.withResolvers<SignInResult>();
  signInMock.mockReturnValueOnce(deferred.promise).mockResolvedValueOnce({ ok: false, error: 'unavailable' });
  await renderRouter(routes, { initialUrl: '/' });
  await fillLogin();
  const submit = screen.getByRole('button', { name: 'Ingresar' });

  await fireEvent.press(submit);
  await fireEvent.press(submit);
  expect(signInMock).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Ingresar' })).toBeDisabled();

  await act(async () => {
    deferred.resolve({ ok: false, error: 'invalid-credentials' });
  });
  expect(await screen.findByText('Revisá el correo y la contraseña.')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Ingresar' }));
  expect(await screen.findByText('El servicio no está disponible. Intentá de nuevo.')).toBeOnTheScreen();
  expect(signInMock).toHaveBeenCalledTimes(2);
});


it('lee el saldo autenticado, conserva la última lectura si falla un refresco y permite reintentar', async () => {
  signInMock.mockResolvedValue({ ok: true, session });
  readBalanceMock.mockResolvedValueOnce({ ok: true, data: { amount: 1750.25, currency: 'USD' } })
    .mockResolvedValueOnce({ ok: false, error: 'unavailable' })
    .mockResolvedValueOnce({ ok: true, data: { amount: 2200.50, currency: 'USD' } });

  await renderRouter(routes);
  await fillLogin();
  await fireEvent.press(screen.getByRole('button', { name: 'Ingresar' }));
  expect(await screen.findByText(/1\.750,25/)).toBeOnTheScreen();
  expect(readBalanceMock).toHaveBeenCalledWith(session.token);

  await fireEvent.press(screen.getByRole('button', { name: 'Actualizar saldo' }));
  expect(await screen.findByText('El servicio no está disponible. Intentá de nuevo.')).toBeOnTheScreen();
  expect(screen.getByText(/1\.750,25/)).toBeOnTheScreen();
  expect(screen.getByText('Último saldo consultado')).toBeOnTheScreen();

  await fireEvent.press(screen.getByRole('button', { name: 'Actualizar saldo' }));
  expect(await screen.findByText(/2\.200,50/)).toBeOnTheScreen();
});

it('cierra el acceso privado si la API indica que venció la sesión', async () => {
  signInMock.mockResolvedValue({ ok: true, session });
  readBalanceMock.mockResolvedValue({ ok: false, error: 'unauthorized' });

  await renderRouter(routes);
  await fillLogin();
  await fireEvent.press(screen.getByRole('button', { name: 'Ingresar' }));

  expect(await screen.findByText('Tu sesión venció. Volvé a ingresar.')).toBeOnTheScreen();
  expect(screen).toHavePathname('/');
});


it('abre el historial desde inicio, lee los movimientos autorizados y vuelve a la cuenta', async () => {
  signInMock.mockResolvedValue({ ok: true, session });
  readHistoryMock.mockResolvedValue({
    ok: true,
    data: [{ key: '1', date: '2026-08-21', amountMinor: 1025, currency: 'USD', recipientName: 'Sofía Demo' }],
  });
  await renderRouter(routes);
  await fillLogin();
  await fireEvent.press(screen.getByRole('button', { name: 'Ingresar' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Historial' }));

  expect(await screen.findByText('Sofía Demo')).toBeOnTheScreen();
  expect(readHistoryMock).toHaveBeenCalledWith(session.token);
  expect(screen).toHavePathname('/history');

  await fireEvent.press(screen.getByRole('button', { name: 'Volver al inicio' }));
  expect(screen).toHavePathname('/home');
});

it('protege un enlace directo al historial sin sesión', async () => {
  await renderRouter(routes, { initialUrl: '/history' });

  expect(await screen.findByRole('header', { name: 'Ingresá a tu cuenta' })).toBeOnTheScreen();
  expect(readHistoryMock).not.toHaveBeenCalled();
});


it.each([
  { case: 'con movimiento publicado', amount: 1487.5, displayed: /1\.487,50/, historyText: 'Sofía Demo', hasEntry: true },
  { case: 'sin movimiento publicado', amount: 1500, displayed: /1\.500,00/, historyText: 'Todavía no hay transferencias', hasEntry: false },
])('consulta historial y saldo después de una solicitud aceptada $case', async ({ amount, displayed, historyText, hasEntry }) => {
  signInMock.mockResolvedValue({ ok: true, session });
  const initialBalance = { ok: true, data: { amount: 1500, currency: 'USD' } } as const;
  readBalanceMock.mockResolvedValueOnce(initialBalance).mockResolvedValueOnce(initialBalance)
    .mockResolvedValue({ ok: true, data: { amount, currency: 'USD' } });
  const transfer = Promise.withResolvers<Awaited<ReturnType<typeof sendTransfer>>>();
  sendTransferMock.mockReturnValue(transfer.promise);
  readHistoryMock.mockResolvedValue({
    ok: true,
    data: hasEntry ? [{ key: '2', date: '2026-08-22', amountMinor: 1250, currency: 'USD', recipientName: 'Sofía Demo' }] : [],
  });

  await renderRouter(routes);
  await fillLogin();
  await fireEvent.press(screen.getByRole('button', { name: 'Ingresar' }));
  expect(await screen.findByText(/1\.500,00/)).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Transferir' }));
  expect(await screen.findByRole('header', { name: 'Nueva transferencia' })).toBeOnTheScreen();

  await fireEvent.changeText(screen.getByLabelText('Documento del destinatario'), '000123');
  await fireEvent.changeText(screen.getByLabelText('Monto en USD'), '12,50');
  await fireEvent.press(screen.getByRole('button', { name: 'Enviar transferencia' }));

  await act(() => router.back());
  expect(screen).toHavePathname('/transfer');
  expect(screen.getByLabelText('Documento del destinatario')).toHaveDisplayValue('000123');
  expect(screen.getByLabelText('Monto en USD')).toHaveDisplayValue('12,50');

  await fireEvent.press(screen.getByRole('button', { name: 'Enviar transferencia' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Confirmar transferencia' }));

  await act(() => router.back());
  expect(screen).toHavePathname('/transfer');
  await act(async () => { transfer.resolve({ ok: true }); });
  expect(await screen.findByRole('header', { name: 'Transferencia exitosa' })).toBeOnTheScreen();
  expect(sendTransferMock).toHaveBeenCalledWith(session.token, expect.objectContaining({
    recipientDocument: '000123', amountMinor: 1250, currency: 'USD',
  }));
  await fireEvent.press(screen.getByRole('button', { name: 'Ver historial' }));
  expect(await screen.findByText(historyText)).toBeOnTheScreen();
  expect(readHistoryMock).toHaveBeenCalledWith(session.token);
  await fireEvent.press(screen.getByRole('button', { name: 'Volver al inicio' }));
  expect(await screen.findByText(displayed)).toBeOnTheScreen();
  expect(readBalanceMock).toHaveBeenCalledTimes(3);
  expect(sendTransferMock).toHaveBeenCalledTimes(1);
});
