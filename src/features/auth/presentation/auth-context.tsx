import { createContext, use, useCallback, useState, type PropsWithChildren } from 'react';

import type { Session, SignIn } from '../application/sign-in';

type AuthState = Readonly<{
  session: Session | null;
  authenticate: SignIn;
  signOut: () => void;
  expireSession: () => void;
  notice: string;
}>;

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children, signIn }: PropsWithChildren<{ signIn: SignIn }>) {
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState('');

  const authenticate: SignIn = async credentials => {
    const result = await signIn(credentials);
    if (result.ok) {
      setNotice('');
      setSession(result.session);
    }
    return result;
  };

  const signOut = useCallback(() => {
    setSession(null);
    setNotice('');
  }, []);

  const expireSession = useCallback(() => {
    setSession(null);
    setNotice('Tu sesión venció. Volvé a ingresar.');
  }, []);

  return (
    <AuthContext value={{ session, authenticate, signOut, expireSession, notice }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const auth = use(AuthContext);
  if (!auth) throw new Error('AuthProvider is required');
  return auth;
}
