import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ResourceState } from '@/shared/presentation/use-private-resource';
import { colors, spacing } from '@/theme';

import type { Balance } from '../domain/balance';
import { BalanceCard } from './balance-card';

type Props = Readonly<{
  name: string;
  balance: ResourceState<Balance>;
  onReload: () => void;
  onSignOut: () => void;
  onHistory: () => void;
}>;

export function AccountScreen({ name, balance, onReload, onSignOut, onHistory }: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>BancoXYZ<Text style={styles.accent}>.</Text></Text>
          <Pressable accessibilityRole="button" onPress={onSignOut} style={styles.button}>
            <Text style={styles.buttonLabel}>Cerrar sesión</Text>
          </Pressable>
        </View>
        <Text accessibilityRole="header" style={styles.heading}>Hola, {name}</Text>
        <BalanceCard state={balance} onReload={onReload} />
        <Pressable accessibilityRole="button" accessibilityLabel="Ver historial" onPress={onHistory} style={styles.quickAction}>
          <Text style={styles.buttonLabel}>Ver historial</Text>
          <Text style={styles.actionArrow} importantForAccessibility="no">›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: spacing.lg, padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  brand: { color: colors.ink, fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },
  accent: { color: colors.primary },
  heading: { color: colors.ink, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 },
  button: { minHeight: 48, justifyContent: 'center' },
  quickAction: {
    minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: spacing.md, paddingHorizontal: spacing.md, borderRadius: spacing.sm,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  actionArrow: { color: colors.primary, fontSize: 24 },
  buttonLabel: { color: colors.primary, fontSize: 15, fontWeight: '700' },
});
