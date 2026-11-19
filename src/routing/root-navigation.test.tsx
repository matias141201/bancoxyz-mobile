import { renderRouter, screen } from 'expo-router/testing-library';

import RootLayout from '@/app/_layout';
import IndexRoute from '@/app/index';

it('abre el inicio de BancoXYZ desde la ruta raíz', async () => {
  await renderRouter({ _layout: RootLayout, index: IndexRoute }, { initialUrl: '/' });

  expect(await screen.findByRole('header', { name: 'BancoXYZ' })).toBeOnTheScreen();
  expect(screen).toHavePathname('/');
});
