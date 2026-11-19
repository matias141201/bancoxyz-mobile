import type { Credentials } from '../domain/credentials';

export type Session = Readonly<{
  token: string;
  user: Readonly<{ id: number; name: string; email: string }>;
}>;

export type SignInError = 'invalid-credentials' | 'unavailable' | 'invalid-response' | 'misconfigured';

export type SignInResult =
  | { ok: true; session: Session }
  | { ok: false; error: SignInError };

export type SignIn = (credentials: Credentials) => Promise<SignInResult>;
