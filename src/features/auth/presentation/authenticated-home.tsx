import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

import { useAuth } from './auth-context';

export function AuthenticatedHome() {
  const { session, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.heading}>Hola, {session?.user.name}</Text>
        <Pressable accessibilityRole="button" onPress={signOut} style={styles.button}>
          <Text style={styles.label}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: spacing.lg, padding: spacing.lg },
  heading: { color: colors.ink, fontSize: 30, fontWeight: '700' },
  button: { minHeight: 48, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: spacing.md },
  label: { color: colors.primary, fontSize: 16, fontWeight: '700' },
});
