import { useRouter } from 'expo-router';

import { readBalance } from '@/composition/balance';
import { useAuth } from '@/features/auth/presentation/auth-context';
import { AccountScreen } from '@/features/balance/presentation/account-screen';
import { usePrivateResource } from '@/shared/presentation/use-private-resource';

export default function HomeRoute() {
  const router = useRouter();
  const { session, signOut, expireSession } = useAuth();
  const { state, reload } = usePrivateResource(session?.token, readBalance, expireSession);

  if (!session) return null;

  return (
    <AccountScreen
      name={session.user.name}
      balance={state}
      onReload={reload}
      onSignOut={signOut}
      onHistory={() => router.push('/history')}
    />
  );
}
