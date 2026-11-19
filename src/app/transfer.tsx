import { usePreventRemove, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { readBalance } from '@/composition/balance';
import { sendTransfer } from '@/composition/transfer';
import { useAuth } from '@/features/auth/presentation/auth-context';
import { TransferCurrencyState } from '@/features/transfers/presentation/transfer-currency-state';
import { TransferScreen } from '@/features/transfers/presentation/transfer-screen';
import { usePrivateResource } from '@/shared/presentation/use-private-resource';

export default function TransferRoute() {
  const router = useRouter();
  const { session, expireSession } = useAuth();
  const [sending, setSending] = useState(false);
  // Keep the route mounted until the server outcome is known.
  usePreventRemove(sending, () => undefined);

  useEffect(() => {
    if (!sending || process.env.EXPO_OS !== 'web') return;
    const preventUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [sending]);
  const { state, reload } = usePrivateResource(session?.token, readBalance, expireSession);
  const back = () => router.dismissTo('/home');

  if (!session) return null;

  if (state.status !== 'ready') {
    return <TransferCurrencyState state={state} onReload={reload} onBack={back} />;
  }

  return (
    <TransferScreen
      currency={state.data.currency}
      submit={async order => {
        setSending(true);
        try {
          return await sendTransfer(session.token, order);
        } finally {
          setSending(false);
        }
      }}
      onSuccess={back}
      onUnauthorized={expireSession}
      onBack={back}
      onViewHistory={() => router.replace('/history')}
    />
  );
}
