import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './auth-context';
import { LoginScreen } from './login-screen';

const metrics = {
  frame: { x: 0, y: 0, width: 400, height: 800 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

it('habilita el ingreso solo con un correo válido y una contraseña', async () => {
  const signIn = jest.fn().mockResolvedValue({ ok: false, error: 'invalid-credentials' });
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <AuthProvider signIn={signIn}>
        <LoginScreen />
      </AuthProvider>
    </SafeAreaProvider>,
  );

  const enter = () => screen.getByRole('button', { name: 'Ingresar' });
  const email = () => screen.getByLabelText('Correo electrónico');
  const password = () => screen.getByLabelText('Contraseña');

  expect(enter()).toBeDisabled();
  await fireEvent.changeText(email(), 'matias.example.com');
  await fireEvent(email(), 'blur');
  expect(screen.getByText('Ingresá un correo electrónico válido.')).toBeOnTheScreen();
  await fireEvent.changeText(password(), 'secreto');
  await fireEvent(password(), 'submitEditing');
  expect(enter()).toBeDisabled();
  expect(signIn).not.toHaveBeenCalled();

  await fireEvent.changeText(email(), ' matias@example.com ');
  expect(enter()).toBeEnabled();
  expect(screen.queryByText('Ingresá un correo electrónico válido.')).not.toBeOnTheScreen();

  await fireEvent.changeText(password(), '');
  expect(enter()).toBeDisabled();

  await fireEvent.changeText(password(), 'secreto');
  await fireEvent.press(enter());
  expect(signIn).toHaveBeenCalledWith({ email: 'matias@example.com', password: 'secreto' });
  expect(await screen.findByRole('alert')).toHaveTextContent('Revisá el correo y la contraseña.');
});
