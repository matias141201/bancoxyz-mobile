import { fetch } from 'expo/fetch';

import { createRemoteTransfer } from '@/features/transfers/infrastructure/remote-transfer';

export const sendTransfer = createRemoteTransfer(process.env.EXPO_PUBLIC_TRANSFER_URL, fetch);
