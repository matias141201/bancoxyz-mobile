import { fetch } from 'expo/fetch';

import { parseHistory } from '@/features/history/domain/history';
import { createPrivateReader } from '@/shared/network/private-reader';

export const readHistory = createPrivateReader(process.env.EXPO_PUBLIC_HISTORY_URL, fetch, parseHistory);
