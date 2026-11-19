import { validateCredentials } from './credentials';

describe('validateCredentials', () => {
  it('recorta espacios del correo sin modificar la contraseña', () => {
    expect(validateCredentials({ email: '  demo@example.com ', password: ' con espacios ' })).toEqual({
      ok: true,
      credentials: { email: 'demo@example.com', password: ' con espacios ' },
    });
  });

  it('indica si falta el correo o si su formato es inválido', () => {
    for (const email of ['', 'sin-arroba', 'correo@', 'dos palabras@example.com']) {
      expect(validateCredentials({ email, password: 'pass' })).toEqual({ ok: false, field: 'email' });
    }
  });

  it('pide contraseña si el correo es válido y el campo está vacío', () => {
    expect(validateCredentials({ email: 'demo@example.com', password: '' })).toEqual({
      ok: false,
      field: 'password',
    });
  });
});
