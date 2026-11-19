import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

export function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.mark}>
            <Text style={styles.monogram}>XYZ</Text>
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            BancoXYZ
          </Text>
          <Text style={styles.description}>
            El acceso a tu cuenta estará disponible próximamente.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 460,
    minHeight: 304,
    borderRadius: 28,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
  },
  mark: {
    alignSelf: 'flex-start',
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.accent,
  },
  monogram: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.onPrimary,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1.4,
  },
  description: {
    color: colors.onPrimary,
    fontSize: 17,
    lineHeight: 25,
  },
});
