export type Credentials = Readonly<{ email: string; password: string }>;

type ValidationResult =
  | { ok: true; credentials: Credentials }
  | { ok: false; field: keyof Credentials };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function validateCredentials({ email, password }: Credentials): ValidationResult {
  const cleanEmail = email.trim();

  if (!emailPattern.test(cleanEmail)) {
    return { ok: false, field: 'email' };
  }

  if (password.length === 0) {
    return { ok: false, field: 'password' };
  }

  return { ok: true, credentials: { email: cleanEmail, password } };
}
