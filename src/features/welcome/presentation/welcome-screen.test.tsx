import { render, screen } from '@testing-library/react-native';

import { WelcomeScreen } from './welcome-screen';

describe('WelcomeScreen', () => {
  it('identifica la app y muestra el estado actual de acceso', async () => {
    await render(<WelcomeScreen />);

    expect(screen.getByRole('header', { name: 'BancoXYZ' })).toBeOnTheScreen();
    expect(screen.getByText('El acceso a tu cuenta estará disponible próximamente.')).toBeOnTheScreen();
  });
});
