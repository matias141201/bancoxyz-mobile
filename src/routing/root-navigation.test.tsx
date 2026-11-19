import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import HomeRoute from '@/app/home';
import HistoryRoute from '@/app/history';
import IndexRoute from '@/app/index';
import { readBalance } from '@/composition/balance';
import { readHistory } from '@/composition/history';
import { signIn } from '@/composition/sign-in';
import type { SignInResult } from '@/features/auth/application/sign-in';

jest.mock('@/composition/balance', () => ({ readBalance: jest.fn() }));
jest.mock('@/composition/history', () => ({ readHistory: jest.fn() }));
jest.mock('@/composition/sign-in', () => ({ signIn: jest.fn() }));

const signInMock = jest.mocked(signIn);
const readHistoryMock = jest.mocked(readHistory);
const readBalanceMock = jest.mocked(readBalance);
const session = { token: 'fixture-token', user: { id: 7, name: 'Cliente de prueba', email: 'demo@example.com' } };
const routes = { _layout: RootLayout, index: IndexRoute, home: HomeRoute, history: HistoryRoute };

async function fillLogin() {
  await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'demo@example.com');
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'fixture-password');
}

beforeEach(() => {
  signInMock.mockReset();
  readHistoryMock.mockReset().mockResolvedValue({ ok: true, data: [] });
  readBalanceMock.mockReset().mockResolvedValue({ ok: true, data: { amount: 1500, currency: 'USD' } });
});

it('protege el inicio incluso si se abre un enlace directo', async () => {
  await renderRouter(routes, { initialUrl: '/home' });

  expect(await screen.findByRole('header', { name: 'Ingresá a tu cuenta' })).toBeOnTheScreen();
  expect(screen).toHavePathname('/');
});

it('valida los campos antes de intentar iniciar sesión', async () => {
  await renderRouter(routes, { initialUrl: '/' });
  const submit = screen.getByRole('button', { name: 'Ingresar' });

  await fireEvent.press(submit);
  expect(screen.getByText('Ingresá un correo electrónico válido.')).toBeOnTheScreen();

  await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'demo@example.com');
  await fireEvent.press(submit);
  expect(screen.getByText('Ingresá tu contraseña.')).toBeOnTheScreen();
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
  await fireEvent.press(await screen.findByRole('button', { name: 'Ver historial' }));

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
