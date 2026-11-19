import { fireEvent } from '@testing-library/react-native';
import { fetch } from 'expo/fetch';
import { renderRouter, screen } from 'expo-router/testing-library';

import { localCalendarDate } from '@/shared/domain/calendar-date';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));

const base = 'https://bank.example/default';
const mockEndpoints = {
  login: `${base}/login`,
  balance: `${base}/balance`,
  transfer: `${base}/transfer`,
  history: `${base}/transferList`,
};

jest.mock('expo/virtual/env', () => ({
  env: {
    EXPO_PUBLIC_LOGIN_URL: mockEndpoints.login,
    EXPO_PUBLIC_BALANCE_URL: mockEndpoints.balance,
    EXPO_PUBLIC_TRANSFER_URL: mockEndpoints.transfer,
    EXPO_PUBLIC_HISTORY_URL: mockEndpoints.history,
  },
}));

it('envía el contrato real desde el formulario y vuelve a consultar el backend tras la aceptación', async () => {
  const requests = jest.mocked(fetch);
  const replies = new Map<string, unknown>([
    [mockEndpoints.login, {
      token: 'fixture-token',
      user: { id: 7, name: 'Cliente de prueba', email: 'demo@example.com' },
    }],
    [mockEndpoints.balance, { accountBalance: 1500, currency: 'USD' }],
    [mockEndpoints.transfer, { status: 'success' }],
    [mockEndpoints.history, { message: 'OK', transfers: [] }],
  ]);
  requests.mockImplementation(async url => {
    const reply = replies.get(String(url));
    if (reply === undefined) throw new Error(`Endpoint inesperado: ${url}`);
    return Response.json(reply) as Awaited<ReturnType<typeof fetch>>;
  });

  await renderRouter({
    _layout: jest.requireActual<typeof import('@/app/_layout')>('@/app/_layout').default,
    index: jest.requireActual<typeof import('@/app/index')>('@/app/index').default,
    home: jest.requireActual<typeof import('@/app/home')>('@/app/home').default,
    history: jest.requireActual<typeof import('@/app/history')>('@/app/history').default,
    transfer: jest.requireActual<typeof import('@/app/transfer')>('@/app/transfer').default,
  });

  const press = async (name: string) => fireEvent.press(await screen.findByRole('button', { name }));
  await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'demo@example.com');
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'fixture-password');
  await press('Ingresar');
  expect(await screen.findByText(/1\.500,00/)).toBeOnTheScreen();

  await press('Nueva transferencia');
  await fireEvent.changeText(await screen.findByLabelText('Documento del destinatario'), '000123');
  await fireEvent.changeText(screen.getByLabelText('Monto en USD'), '12,50');
  await press('Revisar transferencia');
  const transferDate = localCalendarDate(new Date());
  await press('Confirmar transferencia');

  expect(await screen.findByRole('header', { name: 'Solicitud aceptada' })).toBeOnTheScreen();
  expect(requests).toHaveBeenCalledWith(mockEndpoints.transfer, expect.objectContaining({
    method: 'POST',
    headers: expect.objectContaining({ Authorization: 'Bearer fixture-token' }),
    body: JSON.stringify({ value: 12.5, currency: 'USD', payeerDocument: '000123', transferDate }),
  }));

  await press('Ver historial');
  expect(await screen.findByText('Todavía no hay transferencias')).toBeOnTheScreen();
  await press('Volver al inicio');
  expect(await screen.findByText(/1\.500,00/)).toBeOnTheScreen();

  expect(requests.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
    [mockEndpoints.login, 'POST'],
    [mockEndpoints.balance, 'GET'],
    [mockEndpoints.balance, 'GET'],
    [mockEndpoints.transfer, 'POST'],
    [mockEndpoints.history, 'GET'],
    [mockEndpoints.balance, 'GET'],
  ]);
  expect(requests).toHaveBeenCalledWith(mockEndpoints.history, expect.objectContaining({
    headers: expect.objectContaining({ Authorization: 'Bearer fixture-token' }),
  }));
});
