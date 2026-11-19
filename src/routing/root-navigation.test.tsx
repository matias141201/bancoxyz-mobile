import { act, fireEvent } from '@testing-library/react-native';
import { renderRouter, screen } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import HomeRoute from '@/app/home';
import IndexRoute from '@/app/index';
import { signIn } from '@/composition/sign-in';
import type { SignInResult } from '@/features/auth/application/sign-in';

jest.mock('@/composition/sign-in', () => ({ signIn: jest.fn() }));

const signInMock = jest.mocked(signIn);
const routes = { _layout: RootLayout, index: IndexRoute, home: HomeRoute };

async function fillLogin() {
  await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'demo@example.com');
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'fixture-password');
}

beforeEach(() => signInMock.mockReset());

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
    session: { token: 'fixture-token', user: { id: 7, name: 'Cliente de prueba', email: 'demo@example.com' } },
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
