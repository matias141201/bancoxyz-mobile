import { createContext, use, useState, type PropsWithChildren } from 'react';

import type { Session, SignIn } from '../application/sign-in';

type AuthState = Readonly<{
  session: Session | null;
  authenticate: SignIn;
  signOut: () => void;
}>;

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children, signIn }: PropsWithChildren<{ signIn: SignIn }>) {
  const [session, setSession] = useState<Session | null>(null);

  const authenticate: SignIn = async credentials => {
    const result = await signIn(credentials);
    if (result.ok) setSession(result.session);
    return result;
  };

  return (
    <AuthContext value={{ session, authenticate, signOut: () => setSession(null) }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const auth = use(AuthContext);
  if (!auth) throw new Error('AuthProvider is required');
  return auth;
}
