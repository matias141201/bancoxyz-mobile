import { fetch } from 'expo/fetch';

import { createRemoteBalance } from '@/features/balance/infrastructure/remote-balance';

export const readBalance = createRemoteBalance(process.env.EXPO_PUBLIC_BALANCE_URL, fetch);
