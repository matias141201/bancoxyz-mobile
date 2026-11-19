import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';

import { signIn } from '@/composition/sign-in';
import { AuthProvider, useAuth } from '@/features/auth/presentation/auth-context';
import { colors } from '@/theme';

function Routes() {
  const { session } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="home" />
        <Stack.Screen name="history" />
        <Stack.Screen name="transfer" options={{ gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider signIn={signIn}>
      <StatusBar style="dark" />
      <Routes />
    </AuthProvider>
  );
}
