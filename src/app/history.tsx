import { useRouter } from 'expo-router';

import { readHistory } from '@/composition/history';
import { useAuth } from '@/features/auth/presentation/auth-context';
import { HistoryScreen } from '@/features/history/presentation/history-screen';
import { usePrivateResource } from '@/shared/presentation/use-private-resource';

export default function HistoryRoute() {
  const router = useRouter();
  const { session, expireSession } = useAuth();
  const { state, reload } = usePrivateResource(session?.token, readHistory, expireSession);

  if (!session) return null;

  return (
    <HistoryScreen
      state={state.status === 'ready' ? { ...state, entries: state.data } : state}
      onReload={reload}
      onBack={() => router.canGoBack() ? router.back() : router.replace('/home')}
    />
  );
}
