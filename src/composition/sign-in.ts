import { fetch } from 'expo/fetch';

import { createRemoteAuth } from '@/features/auth/infrastructure/remote-auth';

export const signIn = createRemoteAuth(process.env.EXPO_PUBLIC_LOGIN_URL, fetch);
